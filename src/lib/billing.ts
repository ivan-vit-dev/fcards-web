// Free/paid switch. NEXT_PUBLIC_BILLING_MODE = "paid" turns on plans and Stripe payments;
// "free" or unset = everything is free for everyone (only AI keeps a monthly safety cap).
// Must match BILLING_MODE in functions/.env — the server enforces the real limits.

export const BILLING_MODE: "free" | "paid" =
  process.env.NEXT_PUBLIC_BILLING_MODE?.trim().toLowerCase() === "paid" ? "paid" : "free";

export const isPaidMode = () => BILLING_MODE === "paid";

// Display/pre-check only; the server uses FREE_MODE_AI_CREDITS from functions/.env.
export const FREE_MODE_AI_CREDITS = Number(process.env.NEXT_PUBLIC_FREE_MODE_AI_CREDITS) || 20;

// Subscription statuses that keep paid features (past_due = Stripe is retrying a payment).
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"];
