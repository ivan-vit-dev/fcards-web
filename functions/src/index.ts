import * as admin from "firebase-admin";
import { getDownloadURL } from "firebase-admin/storage";
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import Replicate from "replicate";
import sharp from "sharp";
import Anthropic from "@anthropic-ai/sdk";

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const { FieldValue } = admin.firestore;

setGlobalOptions({ region: "europe-west1", timeoutSeconds: 300 });

// v2 functions only receive secrets they declare, so each onCall lists its own.
const REPLICATE_API_KEY = defineSecret("REPLICATE_API_KEY");
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

// Replicate cold starts can take well over the 60 s default.
const replicateOpts = { secrets: [REPLICATE_API_KEY], timeoutSeconds: 300, memory: "512MiB" as const };
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
  photoUrl?: string;
  photoCutout?: boolean;
  cardStats?: { goals?: number; assists?: number; rating?: number; overall?: number };
}

interface PlayerDoc {
  displayName?: string;
  position?: string;
  photoURL?: string;
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
  // Log only the message: SDK errors (e.g. Replicate ApiError) carry the request incl. the API key.
  console.error(message, err instanceof Error ? err.message : String(err));
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
  // 402 = the Replicate account is out of credit — a platform problem, not the user's.
  const outOfCredit = err instanceof Error && err.message.includes("402");
  throw new HttpsError(outOfCredit ? "unavailable" : "internal", message);
}

async function getPlayer(uid: string, playerId: string): Promise<PlayerDoc> {
  const snap = await db.doc(`users/${uid}/players/${playerId}`).get();
  return (snap.data() as PlayerDoc | undefined) ?? {};
}

// Runs a Replicate image model, copies the result into Storage, returns its download URL.
// Official models (e.g. FLUX Kontext) run by name; community models need a pinned version.
async function runImageModel(
  cardId: string,
  name: string,
  model: `${string}/${string}` | `${string}/${string}:${string}`,
  input: Record<string, unknown>,
  postProcess?: (png: Buffer) => Promise<Buffer>
): Promise<string> {
  const output = await getReplicate().run(model, { input });
  const first = Array.isArray(output) ? output[0] : output;
  const res = await fetch(String(first));
  if (!res.ok) throw new Error(`Fetching model output failed: ${res.status}`);

  let data: Buffer = Buffer.from(await res.arrayBuffer());
  let contentType = res.headers.get("content-type") ?? "image/png";
  if (postProcess) {
    data = await postProcess(data);
    contentType = "image/png";
  }

  // Unique name per run: overwriting a file would invalidate URLs kept in the photo history.
  const ext = contentType.includes("jpeg") ? "jpg" : "png";
  const file = storage.bucket().file(`cards/${cardId}/${name}-${Date.now()}.${ext}`);
  await file.save(data, { contentType });
  return getDownloadURL(file);
}

// Softens a cut-out's hard edges so they blend into whatever sits behind (stadium, card art).
// The alpha is blurred and only allowed to decrease, so the edge feathers inward and never
// reveals pixels outside the mask. Already semi-transparent pixels (matted hair) are left
// alone — blurring them would thin out the strands.
async function featherEdges(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const alpha = Buffer.alloc(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];

  const sigma = Math.max(1.2, Math.min(width, height) / 300);
  // sharp widens single-channel images to sRGB on output, so take channel 0 back out.
  const blurred = await sharp(alpha, { raw: { width, height, channels: 1 } })
    .blur(sigma)
    .extractChannel(0)
    .raw()
    .toBuffer();
  for (let i = 0; i < alpha.length; i++) {
    if (alpha[i] === 255) data[i * 4 + 3] = Math.min(255, blurred[i]);
  }

  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

const MAX_PHOTO_VERSIONS = 12;

interface PhotoVersion {
  url: string;
  label: string;
  at: number;
  cutout?: boolean;
}

// Sets the new card photo and appends it to the card's photo history (the original is kept
// as the first entry), so every AI step can be undone from the Studio. `cutout` records whether
// the photo has a transparent background (needed for the stadium behind the player).
async function finishPhotoJob(
  cardId: string,
  url: string,
  label: string,
  sourceUrl: string,
  cutout = false
): Promise<void> {
  const cardRef = db.doc(`cards/${cardId}`);
  await db.runTransaction(async (tx) => {
    const card = (await tx.get(cardRef)).data() ?? {};
    const history: PhotoVersion[] = card.photoVersions?.length
      ? card.photoVersions
      : [{ url: sourceUrl, label: "Originál", at: Date.now() }];
    const next = [...history, { url, label, at: Date.now(), cutout }];
    // Keep the original plus the most recent edits.
    const trimmed = next.length > MAX_PHOTO_VERSIONS ? [next[0], ...next.slice(-(MAX_PHOTO_VERSIONS - 1))] : next;
    tx.update(cardRef, {
      photoUrl: url,
      photoVersions: trimmed,
      photoCutout: cutout,
      aiStatus: "done",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

// ─── removeBackground ─────────────────────────────────────────────────────────

export const removeBackground = onCall(replicateOpts, async (request) => {
  const uid = requireAuth(request);
  const cardId = requireString(request.data?.cardId, "cardId");
  const imageUrl = requireImageUrl(request.data?.imageUrl);

  await startJob(uid, cardId, false);
  try {
    const url = await cutOutPhoto(cardId, imageUrl);
    return { imageUrl: url };
  } catch (err) {
    return failJob(uid, cardId, err, "Background removal failed.");
  }
});

async function cutOutPhoto(cardId: string, imageUrl: string): Promise<string> {
  // Bria RMBG 2.0 mattes hair with partial alpha (strands blend instead of keeping
  // background pockets between them, as the older U2Net-based model did).
  const url = await runImageModel(
    cardId,
    "bg-removed",
    "bria/remove-background:5ecc270b34e9d8e1f007d9dbd3c724f0badf638f05ffaa0c5e0634ed64d3d378",
    { image_url: imageUrl, preserve_alpha: true, preserve_partial_alpha: true },
    featherEdges
  );
  await finishPhotoJob(cardId, url, "Bez pozadí", imageUrl, true);
  return url;
}

// ─── enhanceFace ──────────────────────────────────────────────────────────────

export const enhanceFace = onCall(replicateOpts, async (request) => {
  const uid = requireAuth(request);
  const cardId = requireString(request.data?.cardId, "cardId");
  const imageUrl = requireImageUrl(request.data?.imageUrl);

  await startJob(uid, cardId, true);
  try {
    // CodeFormer: sharper, more natural faces than GFPGAN. Fidelity 0.7 keeps the child's real
    // features instead of "beautifying" them.
    const url = await runImageModel(
      cardId,
      "enhanced",
      "sczhou/codeformer:cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2",
      { image: imageUrl, codeformer_fidelity: 0.7, upscale: 2, face_upsample: true, background_enhance: true }
    );
    await finishPhotoJob(cardId, url, "Vylepšená tvář", imageUrl);
    return { imageUrl: url };
  } catch (err) {
    return failJob(uid, cardId, err, "Face enhancement failed.");
  }
});

// ─── editPhoto: poses, emotions and styles with Google Nano Banana ───────────
// Nano Banana (Gemini 2.5 Flash Image) edits the given photo from an instruction and keeps the
// person recognisable far better than FLUX Kontext Pro, which visibly changed children's faces.
// Clients pick an option id; prompts live only here, so no free-form text reaches the model.

const KEEP_IDENTITY =
  "The child must stay clearly recognisable as the very same person: do not change the face shape, eyes, nose, mouth shape, ears, eyebrows, skin tone, hairstyle or age. Keep the same football kit with the same colours and number.";

const EDIT_OPTIONS: Record<"pose" | "emotion" | "style", Record<string, { label: string; prompt: string }>> = {
  pose: {
    celebrate: { label: "Oslava gólu", prompt: "Change the pose: the player celebrates a goal with both arms raised high above the head." },
    fist: { label: "Vítězná pěst", prompt: "Change the pose: the player pumps one fist in celebration, full of energy." },
    arms_crossed: { label: "Založené ruce", prompt: "Change the pose: the player stands confidently with arms crossed over the chest." },
    thumbs_up: { label: "Palec nahoru", prompt: "Change the pose: the player gives a thumbs up toward the camera with one hand." },
    point: { label: "Ukazuje na tebe", prompt: "Change the pose: the player points straight at the camera with one hand." },
    heart: { label: "Srdíčko", prompt: "Change the pose: the player makes a heart shape with both hands in front of the chest." },
    ball: { label: "Míč v ruce", prompt: "Change the pose: the player holds a football under one arm." },
    trophy: { label: "S pohárem", prompt: "Change the pose: the player lifts a shiny golden trophy above the head." },
    kick: { label: "Kop do míče", prompt: "Change the pose: the player is in a dynamic action pose about to kick a football." },
  },
  emotion: {
    smile: { label: "Úsměv", prompt: "Change only the facial expression to a big, natural, happy smile." },
    focused: { label: "Odhodlání", prompt: "Change only the facial expression to a focused, determined game face." },
    joy: { label: "Radost z gólu", prompt: "Change only the facial expression to shouting with joy, mouth open in celebration." },
    cool: { label: "V pohodě", prompt: "Change only the facial expression to a confident, cool half-smile." },
    wink: { label: "Mrknutí", prompt: "Change only the facial expression to a cheeky wink with a smile." },
  },
  style: {
    fifa: { label: "Herní karta", prompt: "Restyle the photo as a glossy video-game football card portrait with dramatic studio rim lighting." },
    panini: { label: "Retro 90. léta", prompt: "Restyle the photo as a 1990s football sticker photo with warm film colours and soft grain." },
    comic: { label: "Komiks", prompt: "Restyle the photo as a bold comic book illustration with clean ink outlines and vivid flat colours." },
    anime: { label: "Anime", prompt: "Restyle the photo as an anime illustration with clean lines and bright colours." },
    cartoon: { label: "3D animák", prompt: "Restyle the photo as a 3D animated movie character render with soft lighting." },
    fantasy: { label: "Malba", prompt: "Restyle the photo as an epic digital painting with dramatic light." },
    superhero: { label: "Superhrdina", prompt: "Restyle the photo as a superhero comic cover with a glowing heroic aura, keeping the football kit." },
  },
};

// Poses and emotions are paid features; styles keep the old split (fifa/panini/comic free).
const FREE_STYLES = new Set(["fifa", "panini", "comic"]);

export const editPhoto = onCall(replicateOpts, async (request) => {
  const uid = requireAuth(request);
  const cardId = requireString(request.data?.cardId, "cardId");
  const imageUrl = requireImageUrl(request.data?.imageUrl);
  const kind = requireString(request.data?.kind, "kind") as keyof typeof EDIT_OPTIONS;
  const optionId = requireString(request.data?.option, "option");
  const option = EDIT_OPTIONS[kind]?.[optionId];
  if (!option) throw new HttpsError("invalid-argument", "Unknown edit option.");

  const premium = !(kind === "style" && FREE_STYLES.has(optionId));
  await startJob(uid, cardId, premium);
  try {
    const prompt =
      kind === "style"
        ? `Edit this photo. ${option.prompt} Keep the same child recognisable: same face shape, hairstyle, kit colours and pose.`
        : `Edit this photo. ${option.prompt} ${KEEP_IDENTITY} Keep it a photorealistic sports photo with the same lighting, framing and background.`;
    const url = await runImageModel(cardId, `${kind}-${optionId}`, "google/nano-banana", {
      prompt,
      image_input: [imageUrl],
      aspect_ratio: "match_input_image",
      output_format: "png",
    });
    await finishPhotoJob(cardId, url, option.label, imageUrl);
    if (kind === "style") await db.doc(`cards/${cardId}`).update({ aiStyle: optionId });
    return { imageUrl: url };
  } catch (err) {
    return failJob(uid, cardId, err, "Photo edit failed.");
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

  const card = await startJob(uid, cardId, true);
  try {
    // The stadium sits behind the player, so an opaque photo would hide it completely:
    // cut the player out first (part of the same job, no extra credit).
    const photo = card.photoUrl ?? (await getPlayer(uid, card.playerId)).photoURL;
    if (photo && !card.photoCutout) await cutOutPhoto(cardId, photo);

    const url = await runImageModel(
      cardId,
      "stadium",
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        prompt: `${STADIUM_PROMPTS[style]}, ultra wide angle, professional photography, 8k, epic atmosphere`,
        negative_prompt: "people in foreground, players, blurry, low quality",
        // Portrait to match the card's photo area, which it sits behind.
        width: 768,
        height: 1024,
        num_inference_steps: 30,
      }
    );
    await finishJob(cardId, { backgroundUrl: url });
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

// ─── Storage cleanup ──────────────────────────────────────────────────────────
// Deleting a card removes its images: AI outputs and stadiums under cards/{id}/ and the
// Studio crops the browser uploaded to users/{uid}/photos/crop-{id}-*.

export const onCardDeleted = onDocumentDeleted("cards/{cardId}", async (event) => {
  const cardId = event.params.cardId;
  const userId = event.data?.get("userId") as string | undefined;
  const bucket = storage.bucket();
  await Promise.all([
    bucket.deleteFiles({ prefix: `cards/${cardId}/` }),
    userId ? bucket.deleteFiles({ prefix: `users/${userId}/photos/crop-${cardId}-` }) : Promise.resolve(),
  ]);
});
