import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import Replicate from "replicate";
import OpenAI from "openai";

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

setGlobalOptions({ region: "europe-west1", timeoutSeconds: 300 });

const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Shared helpers ────────────────────────────────────────────────────────────

function requireAuth(context: { auth?: { uid: string } }): string {
  if (!context.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  return context.auth.uid;
}

async function setCardStatus(
  cardId: string,
  status: "processing" | "done" | "error",
  extra: Record<string, unknown> = {}
): Promise<void> {
  await db.doc(`cards/${cardId}`).update({
    aiStatus: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...extra,
  });
}

async function uploadBuffer(
  buffer: Buffer,
  cardId: string,
  filename: string
): Promise<string> {
  const bucket = storage.bucket();
  const file = bucket.file(`cards/${cardId}/${filename}`);
  await file.save(buffer, { contentType: "image/png", public: true });
  return file.publicUrl();
}

async function urlToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

// ─── removeBackground ─────────────────────────────────────────────────────────

export const removeBackground = onCall(async (request) => {
  const uid = requireAuth(request);
  const { cardId, imageUrl } = request.data as { cardId: string; imageUrl: string };

  if (!cardId || !imageUrl) {
    throw new HttpsError("invalid-argument", "cardId and imageUrl are required.");
  }

  await setCardStatus(cardId, "processing");

  try {
    const output = await replicate.run(
      "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285d65c14638cc5f36f34befaf1",
      { input: { image: imageUrl } }
    );

    const resultUrl = typeof output === "string" ? output : String(output);
    const buf = await urlToBuffer(resultUrl);
    const publicUrl = await uploadBuffer(buf, cardId, "bg-removed.png");

    await setCardStatus(cardId, "done", { imageUrl: publicUrl });
    return { success: true, imageUrl: publicUrl };
  } catch (err) {
    await setCardStatus(cardId, "error");
    throw new HttpsError("internal", "Background removal failed.");
  }
});

// ─── enhanceFace ──────────────────────────────────────────────────────────────

export const enhanceFace = onCall(async (request) => {
  requireAuth(request);
  const { cardId, imageUrl } = request.data as { cardId: string; imageUrl: string };

  if (!cardId || !imageUrl) {
    throw new HttpsError("invalid-argument", "cardId and imageUrl are required.");
  }

  await setCardStatus(cardId, "processing");

  try {
    const output = await replicate.run(
      "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
      { input: { img: imageUrl, version: "v1.4", scale: 2 } }
    );

    const resultUrl = typeof output === "string" ? output : String(output);
    const buf = await urlToBuffer(resultUrl);
    const publicUrl = await uploadBuffer(buf, cardId, "enhanced.png");

    await setCardStatus(cardId, "done", { imageUrl: publicUrl });
    return { success: true, imageUrl: publicUrl };
  } catch {
    await setCardStatus(cardId, "error");
    throw new HttpsError("internal", "Face enhancement failed.");
  }
});

// ─── generateActionPose ───────────────────────────────────────────────────────

export const generateActionPose = onCall(async (request) => {
  requireAuth(request);
  const { cardId, playerName, position } = request.data as {
    cardId: string;
    playerName: string;
    position: string;
  };

  if (!cardId) throw new HttpsError("invalid-argument", "cardId is required.");

  await setCardStatus(cardId, "processing");

  const positionPrompts: Record<string, string> = {
    goalkeeper: "goalkeeper diving save dramatic action pose",
    defender: "defender tackle action pose football",
    midfielder: "midfielder dribbling ball action pose football",
    forward: "striker scoring goal celebration action pose football",
  };

  const prompt = `Professional football player ${playerName}, ${positionPrompts[position] ?? "football action pose"}, stadium background, dramatic lighting, photorealistic, 8k`;

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt,
          negative_prompt: "blurry, low quality, cartoon, anime",
          width: 768,
          height: 1024,
          num_inference_steps: 30,
        },
      }
    );

    const urls = output as string[];
    const resultUrl = urls[0];
    const buf = await urlToBuffer(resultUrl);
    const publicUrl = await uploadBuffer(buf, cardId, "action-pose.png");

    await setCardStatus(cardId, "done", { imageUrl: publicUrl });
    return { success: true, imageUrl: publicUrl };
  } catch {
    await setCardStatus(cardId, "error");
    throw new HttpsError("internal", "Action pose generation failed.");
  }
});

// ─── generateStadium ──────────────────────────────────────────────────────────

export const generateStadium = onCall(async (request) => {
  requireAuth(request);
  const { cardId, stadiumStyle } = request.data as {
    cardId: string;
    stadiumStyle?: string;
  };

  if (!cardId) throw new HttpsError("invalid-argument", "cardId is required.");

  await setCardStatus(cardId, "processing");

  const styleMap: Record<string, string> = {
    night: "night match stadium floodlights crowd",
    sunset: "sunset golden hour football stadium",
    champions: "champions league stadium night blue glow",
    empty: "empty stadium dramatic cinematic",
  };

  const prompt = `${styleMap[stadiumStyle ?? "night"] ?? "football stadium"}, ultra wide angle, professional photography, 8k, epic atmosphere`;

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt,
          negative_prompt: "people in foreground, blurry, low quality",
          width: 1024,
          height: 768,
          num_inference_steps: 30,
        },
      }
    );

    const urls = output as string[];
    const buf = await urlToBuffer(urls[0]);
    const publicUrl = await uploadBuffer(buf, cardId, "stadium.png");

    await setCardStatus(cardId, "done", { imageUrl: publicUrl });
    return { success: true, imageUrl: publicUrl };
  } catch {
    await setCardStatus(cardId, "error");
    throw new HttpsError("internal", "Stadium generation failed.");
  }
});

// ─── generateCardStory ────────────────────────────────────────────────────────

export const generateCardStory = onCall(async (request) => {
  requireAuth(request);
  const { cardId, playerName, position, goals, assists, rating } = request.data as {
    cardId: string;
    playerName: string;
    position: string;
    goals?: number;
    assists?: number;
    rating?: number;
  };

  if (!cardId) throw new HttpsError("invalid-argument", "cardId is required.");

  await setCardStatus(cardId, "processing");

  const positionCs: Record<string, string> = {
    goalkeeper: "brankář",
    defender: "obránce",
    midfielder: "záložník",
    forward: "útočník",
  };

  const systemPrompt = `Jsi sportovní novinář píšící krátké, inspirativní popisy fotbalových kartiček pro děti 6–16 let. Popis musí být v češtině, maximálně 3 věty, nadšený a motivující.`;

  const userPrompt = `Napiš popis pro kartičku hráče ${playerName} (${positionCs[position] ?? position}). Statistiky: ${goals ?? 0} gólů, ${assists ?? 0} asistencí, hodnocení ${rating ?? 7}/10.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    const story = completion.choices[0]?.message?.content ?? "";
    await setCardStatus(cardId, "done", { aiStory: story });
    return { success: true, story };
  } catch {
    await setCardStatus(cardId, "error");
    throw new HttpsError("internal", "Card story generation failed.");
  }
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

export const applyAIStyle = onCall(async (request) => {
  requireAuth(request);
  const { cardId, imageUrl, style } = request.data as {
    cardId: string;
    imageUrl: string;
    style: string;
  };

  if (!cardId || !imageUrl || !style) {
    throw new HttpsError("invalid-argument", "cardId, imageUrl and style are required.");
  }

  await setCardStatus(cardId, "processing");

  const stylePrompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.fifa;

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: `${stylePrompt}, high quality, detailed`,
          image: imageUrl,
          prompt_strength: 0.7,
          num_inference_steps: 30,
          width: 768,
          height: 1024,
        },
      }
    );

    const urls = output as string[];
    const buf = await urlToBuffer(urls[0]);
    const publicUrl = await uploadBuffer(buf, cardId, "styled.png");

    await setCardStatus(cardId, "done", { imageUrl: publicUrl, aiStyle: style });
    return { success: true, imageUrl: publicUrl };
  } catch {
    await setCardStatus(cardId, "error");
    throw new HttpsError("internal", "Style transfer failed.");
  }
});
