// Billing: free/paid mode switch + Stripe subscriptions (Checkout, Customer Portal, webhook).
//
// BILLING_MODE (functions/.env) — "paid" turns payments on; anything else (or unset) = the app
// is free: every user gets all features, only AI credits keep a monthly safety cap
// (FREE_MODE_AI_CREDITS) because every AI job costs real money. Keep it in sync with
// NEXT_PUBLIC_BILLING_MODE on the web app (Vercel).
//
// Stripe is the source of truth for subscriptions. The webhook re-reads the subscription from
// the API on every event (events can arrive out of order) and mirrors it onto users/{uid}:
// `subscriptionTier` + `subscription`. Both are privileged fields in firestore.rules.

import * as admin from "firebase-admin";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineInt, defineSecret, defineString } from "firebase-functions/params";
import Stripe from "stripe";

export const BILLING_MODE = defineString("BILLING_MODE", { default: "free" });
export const FREE_MODE_AI_CREDITS = defineInt("FREE_MODE_AI_CREDITS", { default: 20 });
const APP_URL = defineString("APP_URL", { default: "http://localhost:3000" });

// Stripe Price IDs (price_...) of the recurring prices created in the Stripe dashboard.
const PRICES = {
  premium: {
    month: defineString("STRIPE_PRICE_PREMIUM_MONTHLY", { default: "" }),
    year: defineString("STRIPE_PRICE_PREMIUM_YEARLY", { default: "" }),
  },
  team: {
    month: defineString("STRIPE_PRICE_TEAM_MONTHLY", { default: "" }),
    year: defineString("STRIPE_PRICE_TEAM_YEARLY", { default: "" }),
  },
} as const;
type PaidTier = keyof typeof PRICES;
type Interval = "month" | "year";

export const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

export const paidMode = () => BILLING_MODE.value().trim().toLowerCase() === "paid";

/** The tier whose limits apply: in free mode everyone gets everything. */
export function effectiveTier(user: FirebaseFirestore.DocumentData): string {
  return paidMode() ? (user.subscriptionTier ?? "free") : "club";
}

const db = () => admin.firestore();
const { FieldValue, Timestamp } = admin.firestore;
const stripe = () => new Stripe(STRIPE_SECRET_KEY.value());

function requirePaidMode() {
  if (!paidMode()) throw new HttpsError("failed-precondition", "Payments are disabled (BILLING_MODE is not 'paid').");
}

function priceFor(tier: PaidTier, interval: Interval): string {
  const id = PRICES[tier][interval].value().trim();
  if (!id) throw new HttpsError("failed-precondition", `Stripe price for ${tier}/${interval} is not configured.`);
  return id;
}

function tierForPrice(priceId: string): { tier: PaidTier; interval: Interval } | null {
  for (const tier of Object.keys(PRICES) as PaidTier[]) {
    for (const interval of ["month", "year"] as Interval[]) {
      if (PRICES[tier][interval].value().trim() === priceId) return { tier, interval };
    }
  }
  return null;
}

function returnUrl(locale: unknown, query = ""): string {
  const l = locale === "en" ? "en" : "cs";
  return `${APP_URL.value().replace(/\/$/, "")}/${l}/settings/subscription${query}`;
}

// Statuses that keep the paid features. past_due = Stripe is retrying a failed payment
// (Smart Retries); access stays until Stripe gives up and the status becomes unpaid/canceled.
const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

async function ensureCustomer(uid: string, user: FirebaseFirestore.DocumentData): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId as string;
  const customer = await stripe().customers.create(
    { email: user.email, name: user.displayName, metadata: { uid } },
    { idempotencyKey: `customer-${uid}` } // double-click on "Vybrat" won't create two customers
  );
  await db().doc(`users/${uid}`).update({ stripeCustomerId: customer.id });
  return customer.id;
}

// ─── Callables ────────────────────────────────────────────────────────────────

export const createCheckoutSession = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  requirePaidMode();
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const tier = request.data?.tier as PaidTier;
  const interval = request.data?.interval as Interval;
  if (!(tier in PRICES) || !["month", "year"].includes(interval)) {
    throw new HttpsError("invalid-argument", "Unknown plan.");
  }

  const userSnap = await db().doc(`users/${uid}`).get();
  const user = userSnap.data() ?? {};
  // Plan changes of an existing subscription go through the Customer Portal (proration).
  if (user.subscription && ACTIVE_STATUSES.has(user.subscription.status)) {
    throw new HttpsError("already-exists", "Subscription already active.");
  }

  const customer = await ensureCustomer(uid, user);
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: uid,
    line_items: [{ price: priceFor(tier, interval), quantity: 1 }],
    subscription_data: { metadata: { uid } },
    metadata: { uid },
    locale: request.data?.locale === "en" ? "en" : "cs",
    allow_promotion_codes: true,
    // Invoices for Czech customers and clubs (IČO/DIČ).
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    customer_update: { address: "auto", name: "auto" },
    success_url: returnUrl(request.data?.locale, "?checkout=success"),
    cancel_url: returnUrl(request.data?.locale, "?checkout=cancel"),
  });
  if (!session.url) throw new HttpsError("internal", "Checkout session has no URL.");
  return { url: session.url };
});

/** Stripe-hosted page to change plan, cancel, update the card and download invoices. */
export const createPortalSession = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  requirePaidMode();
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const customer = (await db().doc(`users/${uid}`).get()).get("stripeCustomerId") as string | undefined;
  if (!customer) throw new HttpsError("failed-precondition", "No billing account yet.");
  const session = await stripe().billingPortal.sessions.create({
    customer,
    return_url: returnUrl(request.data?.locale),
  });
  return { url: session.url };
});

// ─── Webhook ──────────────────────────────────────────────────────────────────

async function uidForSubscription(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.uid) return sub.metadata.uid;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const snap = await db().collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

async function syncSubscription(subscriptionId: string): Promise<void> {
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const uid = await uidForSubscription(sub);
  if (!uid) {
    console.warn("stripeWebhook: no user for subscription", sub.id);
    return;
  }
  const userRef = db().doc(`users/${uid}`);
  const item = sub.items.data[0];
  const plan = item ? tierForPrice(item.price.id) : null;
  const active = ACTIVE_STATUSES.has(sub.status);

  await db().runTransaction(async (tx) => {
    const user = (await tx.get(userRef)).data() ?? {};
    // An old subscription ending must not downgrade a user who already has a newer one.
    if (!active && user.subscription?.id && user.subscription.id !== sub.id) return;
    if (active && !plan) console.warn("stripeWebhook: unknown price", item?.price.id);
    tx.update(userRef, {
      subscriptionTier: active && plan ? plan.tier : "free",
      subscription: {
        id: sub.id,
        status: sub.status,
        tier: plan?.tier ?? null,
        interval: plan?.interval ?? null,
        priceId: item?.price.id ?? null,
        currentPeriodEnd: item ? Timestamp.fromMillis(item.current_period_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }
    let event: Stripe.Event;
    try {
      event = stripe().webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"] as string,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      console.warn("stripeWebhook: bad signature", err instanceof Error ? err.message : err);
      res.status(400).send("Invalid signature");
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          if (session.subscription) {
            await syncSubscription(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
        case "customer.subscription.paused":
        case "customer.subscription.resumed":
          await syncSubscription(event.data.object.id);
          break;
        default:
          break; // other events aren't needed: status changes arrive as subscription.updated
      }
      res.status(200).json({ received: true });
    } catch (err) {
      // 500 → Stripe retries the event later. syncSubscription is idempotent.
      console.error("stripeWebhook: handling failed", event.type, err instanceof Error ? err.message : err);
      res.status(500).send("Handler failed");
    }
  }
);

/** For deleteAccount: stop billing a user who erases their account. Invoices stay in Stripe (accounting law). */
export async function cancelSubscriptionsFor(user: FirebaseFirestore.DocumentData): Promise<void> {
  if (!user.stripeCustomerId) return;
  const subs = await stripe().subscriptions.list({ customer: user.stripeCustomerId, status: "all", limit: 20 });
  await Promise.all(
    subs.data
      .filter((s) => !["canceled", "incomplete_expired"].includes(s.status))
      .map((s) => stripe().subscriptions.cancel(s.id))
  );
}
