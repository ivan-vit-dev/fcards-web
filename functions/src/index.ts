import * as admin from "firebase-admin";
import { getDownloadURL } from "firebase-admin/storage";
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import Replicate from "replicate";
import Anthropic from "@anthropic-ai/sdk";

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const { FieldValue } = admin.firestore;

setGlobalOptions({ region: "europe-west1", timeoutSeconds: 300 });

// v2 functions only receive secrets they declare, so each onCall lists its own.
const REPLICATE_API_KEY = defineSecret("REPLICATE_API_KEY");
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

const replicateOpts = { secrets: [REPLICATE_API_KEY] };
const getReplicate = () => new Replicate({ auth: REPLICATE_API_KEY.value() });

// Keep in sync with TIER_LIMITS in src/lib/subscriptionEngine.ts (-1 = unlimited).
const AI_CREDITS_PER_MONTH: Record<string, number> = {
  free: 2,
  premium: 20,
  team: 50,
  club: -1,
};

// ─── Shared helpers ────────────────────────────────────────────────────────────

interface CardDoc {
  userId: string;
  playerId: string;
  cardStats?: { goals?: number; assists?: number; rating?: number; overall?: number };
}

interface PlayerDoc {
  displayName?: string;
  position?: string;
}

const currentMonth = () => new Date().toISOString().slice(0, 7);

function requireAuth(request: CallableRequest): string {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  return request.auth.uid;
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value) {
    throw new HttpsError("invalid-argument", `${name} is required.`);
  }
  return value;
}

function requireImageUrl(value: unknown): string {
  const url = requireString(value, "imageUrl");
  if (!URL.canParse(url) || new URL(url).protocol !== "https:") {
    throw new HttpsError("invalid-argument", "imageUrl must be an https URL.");
  }
  return url;
}

// Atomically: verify the caller owns the card, enforce tier + monthly AI credits,
// consume one credit and mark the card as processing.
async function startJob(uid: string, cardId: string, premium: boolean): Promise<CardDoc> {
  const cardRef = db.doc(`cards/${cardId}`);
  const userRef = db.doc(`users/${uid}`);

  return db.runTransaction(async (tx) => {
    const [cardSnap, userSnap] = await Promise.all([tx.get(cardRef), tx.get(userRef)]);
    const card = cardSnap.data() as CardDoc | undefined;
    if (!card || card.userId !== uid) {
      throw new HttpsError("not-found", "Card not found.");
    }

    const user = userSnap.data() ?? {};
    const isAdmin = user.role === "superAdmin";
    const tier: string = user.subscriptionTier ?? "free";
    if (premium && tier === "free" && !isAdmin) {
      throw new HttpsError("failed-precondition", "This feature requires a paid plan.");
    }

    const month = currentMonth();
    const used: number = user.aiCreditsMonth === month ? (user.aiCreditsUsedThisMonth ?? 0) : 0;
    const limit = AI_CREDITS_PER_MONTH[tier] ?? 0;
    if (!isAdmin && limit !== -1 && used >= limit) {
      throw new HttpsError("resource-exhausted", "Monthly AI credits used up.");
    }

    tx.update(userRef, {
      aiCreditsMonth: month,
      aiCreditsUsedThisMonth: used + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(cardRef, { aiStatus: "processing", updatedAt: FieldValue.serverTimestamp() });
    return card;
  });
}

async function finishJob(cardId: string, result: Record<string, unknown>): Promise<void> {
  await db.doc(`cards/${cardId}`).update({
    ...result,
    aiStatus: "done",
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// Marks the card as failed and refunds the credit startJob consumed.
async function failJob(uid: string, cardId: string, err: unknown, message: string): Promise<never> {
  console.error(message, err);
  const userRef = db.doc(`users/${uid}`);
  await db.runTransaction(async (tx) => {
    const user = (await tx.get(userRef)).data() ?? {};
    if (user.aiCreditsMonth === currentMonth() && (user.aiCreditsUsedThisMonth ?? 0) > 0) {
      tx.update(userRef, { aiCreditsUsedThisMonth: FieldValue.increment(-1) });
    }
    tx.update(db.doc(`cards/${cardId}`), {
      aiStatus: "error",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  throw new HttpsError("internal", message);
}

async function getPlayer(uid: string, playerId: string): Promise<PlayerDoc> {
  const snap = await db.doc(`users/${uid}/players/${playerId}`).get();
  return (snap.data() as PlayerDoc | undefined) ?? {};
}

// Runs a Replicate image model, copies the result into Storage, returns its download URL.
async function runImageModel(
  cardId: string,
  filename: string,
  model: `${string}/${string}:${string}`,
  input: Record<string, unknown>
): Promise<string> {
  const output = await getReplicate().run(model, { input });
  const first = Array.isArray(output) ? output[0] : output;
  const res = await fetch(String(first));
  if (!res.ok) throw new Error(`Fetching model output failed: ${res.status}`);

  const file = storage.bucket().file(`cards/${cardId}/${filename}`);
  await file.save(Buffer.from(await res.arrayBuffer()), { contentType: "image/png" });
  return getDownloadURL(file);
}

// ─── removeBackground ─────────────────────────────────────────────────────────

export const removeBackground = onCall(replicateOpts, async (request) => {
  const uid = requireAuth(request);
  const cardId = requireString(request.data?.cardId, "cardId");
  const imageUrl = requireImageUrl(request.data?.imageUrl);

  await startJob(uid, cardId, false);
  try {
    const url = await runImageModel(
      cardId,
      "bg-removed.png",
      "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285d65c14638cc5f36f34befaf1",
      { image: imageUrl }
    );
    await finishJob(cardId, { photoUrl: url });
    return { imageUrl: url };
  } catch (err) {
    return failJob(uid, cardId, err, "Background removal failed.");
  }
});

// ─── enhanceFace ──────────────────────────────────────────────────────────────

export const enhanceFace = onCall(replicateOpts, async (request) => {
  const uid = requireAuth(request);
  const cardId = requireString(request.data?.cardId, "cardId");
  const imageUrl = requireImageUrl(request.data?.imageUrl);

  await startJob(uid, cardId, true);
  try {
    const url = await runImageModel(
      cardId,
      "enhanced.png",
      "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
      { img: imageUrl, version: "v1.4", scale: 2 }
    );
    await finishJob(cardId, { photoUrl: url });
    return { imageUrl: url };
  } catch (err) {
    return failJob(uid, cardId, err, "Face enhancement failed.");
  }
});

// ─── generateActionPose ───────────────────────────────────────────────────────

const POSE_PROMPTS: Record<string, string> = {
  goalkeeper: "goalkeeper diving save dramatic action pose",
  defender: "defender tackle action pose football",
  midfielder: "midfielder dribbling ball action pose football",
  forward: "striker scoring goal celebration action pose football",
};

export const generateActionPose = onCall(replicateOpts, async (request) => {
  const uid = requireAuth(request);
  const cardId = requireString(request.data?.cardId, "cardId");

  const card = await startJob(uid, cardId, true);
  try {
    const player = await getPlayer(uid, card.playerId);
    const pose = POSE_PROMPTS[player.position ?? ""] ?? "football action pose";
    const url = await runImageModel(
      cardId,
      "action-pose.png",
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        prompt: `Young football player, ${pose}, stadium background, dramatic lighting, photorealistic, 8k`,
        negative_prompt: "blurry, low quality, cartoon, anime",
        width: 768,
        height: 1024,
        num_inference_steps: 30,
      }
    );
    await finishJob(cardId, { photoUrl: url });
    return { imageUrl: url };
  } catch (err) {
    return failJob(uid, cardId, err, "Action pose generation failed.");
  }
});

// ─── generateStadium ──────────────────────────────────────────────────────────

const STADIUM_PROMPTS: Record<string, string> = {
  night: "night match stadium floodlights crowd",
  sunset: "sunset golden hour football stadium",
  champions: "champions league stadium night blue glow",
  empty: "empty stadium dramatic cinematic",
};

export const generateStadium = onCall(replicateOpts, async (request) => {
  const uid = requireAuth(request);
  const cardId = requireString(request.data?.cardId, "cardId");
  const style = STADIUM_PROMPTS[request.data?.stadiumStyle] ? request.data.stadiumStyle : "night";

  await startJob(uid, cardId, true);
  try {
    const url = await runImageModel(
      cardId,
      "stadium.png",
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        prompt: `${STADIUM_PROMPTS[style]}, ultra wide angle, professional photography, 8k, epic atmosphere`,
        negative_prompt: "people in foreground, blurry, low quality",
        width: 1024,
        height: 768,
        num_inference_steps: 30,
      }
    );
    await finishJob(cardId, { photoUrl: url });
    return { imageUrl: url };
  } catch (err) {
    return failJob(uid, cardId, err, "Stadium generation failed.");
  }
});

// ─── generateCardStory ────────────────────────────────────────────────────────

const POSITION_CS: Record<string, string> = {
  goalkeeper: "brankář",
  defender: "obránce",
  midfielder: "záložník",
  forward: "útočník",
};

const STORY_SYSTEM_PROMPT =
  "Jsi sportovní novinář píšící krátké, inspirativní popisy fotbalových kartiček pro děti 6–16 let. " +
  "Popis musí být v češtině, maximálně 3 věty, nadšený a motivující. Odpověz jen samotným popisem.";

export const generateCardStory = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (request) => {
  const uid = requireAuth(request);
  const cardId = requireString(request.data?.cardId, "cardId");

  const card = await startJob(uid, cardId, true);
  try {
    const player = await getPlayer(uid, card.playerId);
    const stats = card.cardStats ?? {};
    const position = POSITION_CS[player.position ?? ""] ?? player.position ?? "hráč";
    const userPrompt =
      `Napiš popis pro kartičku hráče ${player.displayName ?? "Hráč"} (${position}). ` +
      `Statistiky: ${stats.goals ?? 0} gólů, ${stats.assists ?? 0} asistencí, ` +
      `hodnocení ${stats.rating ?? stats.overall ?? 7}.`;

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    const response = await anthropic.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: STORY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    if (response.stop_reason === "refusal") {
      throw new Error(`Story refused: ${response.stop_details?.category ?? "unknown"}`);
    }
    const story = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();
    if (!story) throw new Error("Empty story");

    await finishJob(cardId, { aiStory: story });
    return { story };
  } catch (err) {
    return failJob(uid, cardId, err, "Card story generation failed.");
  }
});

// ─── syncProgress (XP + achievements) ────────────────────────────────────────
// XP is derived from the user's data rather than added per event, so re-running is harmless
// and nothing can be double-counted. Unlocked achievements are permanent.
// Keep XP/level maths in sync with getXPForLevel / getLevelFromXP in src/lib/utils.ts.

const XP_PER_CARD = 50;
const XP_PER_MATCH_PLAYED = 100;
const XP_PER_MVP = 200;

const xpForLevel = (level: number) => (level <= 1 ? 0 : Math.floor(250 * Math.pow(level, 1.6)));

function levelFromXP(xp: number): number {
  let level = 1;
  while (level < 100 && xpForLevel(level + 1) <= xp) level++;
  return level;
}

// Achievement triggerMetric → careerStats field (best player of the account counts).
const CAREER_METRICS: Record<string, string> = {
  goals: "goals",
  assists: "assists",
  matches_played: "matchesPlayed",
  mvp_count: "mvpCount",
  clean_sheets: "cleanSheets",
  saves: "saves",
};

export const syncProgress = onCall(async (request) => {
  const uid = requireAuth(request);
  const userRef = db.doc(`users/${uid}`);
  const unlockedCol = db.collection(`userAchievements/${uid}/unlocked`);

  const [playersSnap, cardsCount, achievementsSnap] = await Promise.all([
    db.collection(`users/${uid}/players`).get(),
    db.collection("cards").where("userId", "==", uid).count().get(),
    db.collection("achievements").get(),
  ]);

  const careers = playersSnap.docs.map(
    (d) => (d.get("careerStats") ?? {}) as Record<string, number>
  );
  const sumOf = (key: string) => careers.reduce((t, c) => t + (c[key] ?? 0), 0);
  const maxOf = (key: string) => careers.reduce((m, c) => Math.max(m, c[key] ?? 0), 0);
  const cards = cardsCount.data().count;

  const metricValue = (metric: string): number | null => {
    if (metric === "cards_created") return cards;
    const field = CAREER_METRICS[metric];
    return field ? maxOf(field) : null;
  };

  return db.runTransaction(async (tx) => {
    const [userSnap, unlockedSnap] = await Promise.all([tx.get(userRef), tx.get(unlockedCol)]);
    const unlocked = new Set(unlockedSnap.docs.map((d) => d.id));

    const newlyUnlocked = achievementsSnap.docs.filter((a) => {
      if (unlocked.has(a.id)) return false;
      const value = metricValue(a.get("triggerMetric") ?? "");
      return value !== null && value >= (a.get("triggerThreshold") ?? Infinity);
    });

    for (const a of newlyUnlocked) {
      tx.set(unlockedCol.doc(a.id), {
        userId: uid,
        achievementId: a.id,
        unlockedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      unlocked.add(a.id);
    }

    const achievementXP = achievementsSnap.docs
      .filter((a) => unlocked.has(a.id))
      .reduce((t, a) => t + (a.get("xpReward") ?? 0), 0);

    const xp =
      cards * XP_PER_CARD +
      sumOf("matchesPlayed") * XP_PER_MATCH_PLAYED +
      sumOf("mvpCount") * XP_PER_MVP +
      achievementXP;
    const level = levelFromXP(xp);
    const oldLevel: number = userSnap.get("level") ?? 1;

    if (xp !== userSnap.get("xp") || level !== oldLevel) {
      tx.update(userRef, { xp, level, updatedAt: FieldValue.serverTimestamp() });
    }

    // Public player profiles can't read the user doc (it holds the email), so mirror the
    // account's level and unlocked achievements onto each player.
    const achievementIds = [...unlocked].sort();
    for (const p of playersSnap.docs) {
      const current = p.get("progress") as { level?: number; achievementIds?: string[] } | undefined;
      if (
        current?.level !== level ||
        (current?.achievementIds ?? []).join() !== achievementIds.join()
      ) {
        tx.update(p.ref, { progress: { level, achievementIds } });
      }
    }

    return {
      xp,
      level,
      leveledUp: level > oldLevel,
      newAchievements: newlyUnlocked.map((a) => ({
        id: a.id,
        nameCs: a.get("nameCs") as string,
        xpReward: (a.get("xpReward") as number) ?? 0,
      })),
    };
  });
});

// ─── applyAIStyle ─────────────────────────────────────────────────────────────

const STYLE_PROMPTS: Record<string, string> = {
  fifa: "FIFA Ultimate Team card style, professional football trading card, premium design, gold border",
  panini: "Panini sticker style, retro football card, soft colors, classic design",
  comic: "comic book style, bold outlines, vibrant colors, dynamic action",
  anime: "anime style, manga art, expressive, dynamic lines, Japanese art",
  cartoon: "cartoon style, fun colorful, child-friendly, bright cheerful",
  fantasy: "fantasy art style, epic magical, dramatic lighting, painterly",
  superhero: "superhero comic style, Marvel DC art, dynamic pose, cape, dramatic lighting",
};
const PREMIUM_STYLES = new Set(["anime", "cartoon", "fantasy", "superhero"]);

export const applyAIStyle = onCall(replicateOpts, async (request) => {
  const uid = requireAuth(request);
  const cardId = requireString(request.data?.cardId, "cardId");
  const imageUrl = requireImageUrl(request.data?.imageUrl);
  const style = requireString(request.data?.style, "style");
  if (!STYLE_PROMPTS[style]) throw new HttpsError("invalid-argument", "Unknown style.");

  await startJob(uid, cardId, PREMIUM_STYLES.has(style));
  try {
    const url = await runImageModel(
      cardId,
      "styled.png",
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        prompt: `${STYLE_PROMPTS[style]}, high quality, detailed`,
        image: imageUrl,
        prompt_strength: 0.7,
        num_inference_steps: 30,
        width: 768,
        height: 1024,
      }
    );
    await finishJob(cardId, { photoUrl: url, aiStyle: style });
    return { imageUrl: url };
  } catch (err) {
    return failJob(uid, cardId, err, "Style transfer failed.");
  }
});
