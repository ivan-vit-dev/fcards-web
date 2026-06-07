/**
 * Seeds achievement definitions into Firestore.
 * Run with: npx tsx scripts/seed-achievements.ts
 *
 * Requires NEXT_PUBLIC_FIREBASE_* env vars (from .env.local).
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
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

const achievements = [
  // ─── Scoring ───────────────────────────────────────────────────────────────
  {
    key: "first_goal",
    nameCs: "První gól",
    nameEn: "First Goal",
    descriptionCs: "Vstřel první gól ve své kariéře.",
    descriptionEn: "Score your first career goal.",
    category: "scoring",
    xpReward: 50,
    rarity: "common",
    iconName: "circle-dot",
    triggerMetric: "goals",
    triggerThreshold: 1,
  },
  {
    key: "goal_scorer_10",
    nameCs: "Střelec",
    nameEn: "Goal Scorer",
    descriptionCs: "10 gólů v kariéře.",
    descriptionEn: "10 career goals.",
    category: "scoring",
    xpReward: 100,
    rarity: "uncommon",
    iconName: "target",
    triggerMetric: "goals",
    triggerThreshold: 10,
  },
  {
    key: "sharpshooter_25",
    nameCs: "Ostrý střelec",
    nameEn: "Sharpshooter",
    descriptionCs: "25 gólů v kariéře.",
    descriptionEn: "25 career goals.",
    category: "scoring",
    xpReward: 200,
    rarity: "rare",
    iconName: "zap",
    triggerMetric: "goals",
    triggerThreshold: 25,
  },
  {
    key: "goal_machine_50",
    nameCs: "Střelecký stroj",
    nameEn: "Goal Machine",
    descriptionCs: "50 gólů v kariéře.",
    descriptionEn: "50 career goals.",
    category: "scoring",
    xpReward: 350,
    rarity: "epic",
    iconName: "flame",
    triggerMetric: "goals",
    triggerThreshold: 50,
  },
  {
    key: "legend_100_goals",
    nameCs: "Legenda střelnice",
    nameEn: "Goal Legend",
    descriptionCs: "100 gólů v kariéře.",
    descriptionEn: "100 career goals.",
    category: "scoring",
    xpReward: 500,
    rarity: "legendary",
    iconName: "trophy",
    triggerMetric: "goals",
    triggerThreshold: 100,
  },

  // ─── Playmaking ────────────────────────────────────────────────────────────
  {
    key: "first_assist",
    nameCs: "Týmový hráč",
    nameEn: "Team Player",
    descriptionCs: "První asistence v kariéře.",
    descriptionEn: "Your first career assist.",
    category: "playmaking",
    xpReward: 50,
    rarity: "common",
    iconName: "handshake",
    triggerMetric: "assists",
    triggerThreshold: 1,
  },
  {
    key: "playmaker_10",
    nameCs: "Tvůrce hry",
    nameEn: "Playmaker",
    descriptionCs: "10 asistencí v kariéře.",
    descriptionEn: "10 career assists.",
    category: "playmaking",
    xpReward: 150,
    rarity: "rare",
    iconName: "git-merge",
    triggerMetric: "assists",
    triggerThreshold: 10,
  },
  {
    key: "maestro_25",
    nameCs: "Maestro",
    nameEn: "Maestro",
    descriptionCs: "25 asistencí v kariéře.",
    descriptionEn: "25 career assists.",
    category: "playmaking",
    xpReward: 300,
    rarity: "epic",
    iconName: "wand-sparkles",
    triggerMetric: "assists",
    triggerThreshold: 25,
  },

  // ─── Defensive ─────────────────────────────────────────────────────────────
  {
    key: "first_clean_sheet",
    nameCs: "Čisté konto",
    nameEn: "Clean Sheet",
    descriptionCs: "První nulová série ve své kariéře.",
    descriptionEn: "Your first career clean sheet.",
    category: "defensive",
    xpReward: 75,
    rarity: "uncommon",
    iconName: "shield",
    triggerMetric: "clean_sheets",
    triggerThreshold: 1,
  },
  {
    key: "iron_wall_10",
    nameCs: "Železná zeď",
    nameEn: "Iron Wall",
    descriptionCs: "10 nulových sérií v kariéře.",
    descriptionEn: "10 career clean sheets.",
    category: "defensive",
    xpReward: 250,
    rarity: "rare",
    iconName: "shield-check",
    triggerMetric: "clean_sheets",
    triggerThreshold: 10,
  },
  {
    key: "fortress_25",
    nameCs: "Nedobytná pevnost",
    nameEn: "Fortress",
    descriptionCs: "25 nulových sérií v kariéře.",
    descriptionEn: "25 career clean sheets.",
    category: "defensive",
    xpReward: 400,
    rarity: "epic",
    iconName: "castle",
    triggerMetric: "clean_sheets",
    triggerThreshold: 25,
  },

  // ─── Milestones ────────────────────────────────────────────────────────────
  {
    key: "debut",
    nameCs: "Debut",
    nameEn: "Debut",
    descriptionCs: "Odehraj svůj první zápas.",
    descriptionEn: "Play your first match.",
    category: "milestone",
    xpReward: 50,
    rarity: "common",
    iconName: "play",
    triggerMetric: "matches_played",
    triggerThreshold: 1,
  },
  {
    key: "veteran_10",
    nameCs: "Veterán",
    nameEn: "Veteran",
    descriptionCs: "10 odehraných zápasů.",
    descriptionEn: "10 matches played.",
    category: "milestone",
    xpReward: 100,
    rarity: "uncommon",
    iconName: "calendar",
    triggerMetric: "matches_played",
    triggerThreshold: 10,
  },
  {
    key: "iron_man_50",
    nameCs: "Železný muž",
    nameEn: "Iron Man",
    descriptionCs: "50 odehraných zápasů.",
    descriptionEn: "50 matches played.",
    category: "milestone",
    xpReward: 300,
    rarity: "epic",
    iconName: "shield",
    triggerMetric: "matches_played",
    triggerThreshold: 50,
  },
  {
    key: "centurion_100",
    nameCs: "Centurion",
    nameEn: "Centurion",
    descriptionCs: "100 odehraných zápasů.",
    descriptionEn: "100 matches played.",
    category: "milestone",
    xpReward: 500,
    rarity: "legendary",
    iconName: "crown",
    triggerMetric: "matches_played",
    triggerThreshold: 100,
  },
  {
    key: "captain_10",
    nameCs: "Kapitán",
    nameEn: "Captain",
    descriptionCs: "10 výkonů jako nejlepší hráč zápasu (MVP).",
    descriptionEn: "10 MVP performances.",
    category: "milestone",
    xpReward: 250,
    rarity: "rare",
    iconName: "star",
    triggerMetric: "mvp_count",
    triggerThreshold: 10,
  },
  {
    key: "superstar_25",
    nameCs: "Superhvězda",
    nameEn: "Superstar",
    descriptionCs: "25 výkonů jako nejlepší hráč zápasu (MVP).",
    descriptionEn: "25 MVP performances.",
    category: "milestone",
    xpReward: 500,
    rarity: "legendary",
    iconName: "sparkles",
    triggerMetric: "mvp_count",
    triggerThreshold: 25,
  },

  // ─── Collection ────────────────────────────────────────────────────────────
  {
    key: "first_card",
    nameCs: "Sběratel",
    nameEn: "Collector",
    descriptionCs: "Vytvoř svou první kartičku.",
    descriptionEn: "Create your first card.",
    category: "collection",
    xpReward: 50,
    rarity: "common",
    iconName: "credit-card",
    triggerMetric: "cards_created",
    triggerThreshold: 1,
  },
  {
    key: "card_collector_10",
    nameCs: "Kartičkový nadšenec",
    nameEn: "Card Enthusiast",
    descriptionCs: "Vytvoř 10 kartiček.",
    descriptionEn: "Create 10 cards.",
    category: "collection",
    xpReward: 150,
    rarity: "uncommon",
    iconName: "layers",
    triggerMetric: "cards_created",
    triggerThreshold: 10,
  },
  {
    key: "card_hoarder_50",
    nameCs: "Kartičkový maniák",
    nameEn: "Card Maniac",
    descriptionCs: "Vytvoř 50 kartiček.",
    descriptionEn: "Create 50 cards.",
    category: "collection",
    xpReward: 350,
    rarity: "epic",
    iconName: "library",
    triggerMetric: "cards_created",
    triggerThreshold: 50,
  },
  {
    key: "golden_archive",
    nameCs: "Zlatý archiv",
    nameEn: "Golden Archive",
    descriptionCs: "Vytvoř 100 kartiček.",
    descriptionEn: "Create 100 cards.",
    category: "collection",
    xpReward: 500,
    rarity: "legendary",
    iconName: "archive",
    triggerMetric: "cards_created",
    triggerThreshold: 100,
  },
];

async function seed() {
  console.log(`Seeding ${achievements.length} achievements...`);
  for (const a of achievements) {
    const ref = await addDoc(collection(db, "achievements"), {
      ...a,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`  ✓ ${a.nameCs} (${ref.id})`);
  }
  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
