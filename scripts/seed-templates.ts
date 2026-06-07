/**
 * Seeds initial card templates into Firestore.
 * Run with: npx tsx scripts/seed-templates.ts
 *
 * Requires NEXT_PUBLIC_FIREBASE_* env vars (from .env.local).
 */
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

const templates = [
  {
    name: "Classic Gold",
    nameCs: "Klasické zlato",
    previewURL: "",
    category: "classic",
    rarityRange: ["common", "uncommon", "rare", "epic", "legendary"],
    requiredTier: "free",
    isActive: true,
  },
  {
    name: "Dark Steel",
    nameCs: "Temná ocel",
    previewURL: "",
    category: "dark",
    rarityRange: ["common", "uncommon", "rare", "epic"],
    requiredTier: "free",
    isActive: true,
  },
  {
    name: "Neon Strike",
    nameCs: "Neonový úder",
    previewURL: "",
    category: "neon",
    rarityRange: ["rare", "epic", "legendary", "mythic"],
    requiredTier: "free",
    isActive: true,
  },
  {
    name: "Retro Panini",
    nameCs: "Retro Panini",
    previewURL: "",
    category: "retro",
    rarityRange: ["common", "uncommon", "rare"],
    requiredTier: "premium",
    isActive: true,
  },
  {
    name: "Holographic Elite",
    nameCs: "Holografická elita",
    previewURL: "",
    category: "holographic",
    rarityRange: ["legendary", "mythic", "limited"],
    requiredTier: "premium",
    isActive: true,
  },
];

async function seed() {
  console.log("Seeding templates...");
  for (const tpl of templates) {
    const ref = await addDoc(collection(db, "templates"), {
      ...tpl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`  ✓ ${tpl.nameCs} (${ref.id})`);
  }
  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
