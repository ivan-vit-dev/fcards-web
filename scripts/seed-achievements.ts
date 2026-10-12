/**
 * Seeds achievement definitions into Firestore. Safe to re-run.
 * Run with: npm run seed:achievements  (or use "Nahrát výchozí data" in /admin)
 */
import { connectAsAdmin, upsert } from "./seed-client";
import { SEED_ACHIEVEMENTS } from "../src/lib/seedData";

async function seed() {
  const db = await connectAsAdmin();
  console.log(`Seeding ${SEED_ACHIEVEMENTS.length} achievements...`);
  for (const a of SEED_ACHIEVEMENTS) {
    const result = await upsert(db, "achievements", a.key, { ...a });
    console.log(`  ✓ ${a.nameCs} (${a.key}, ${result})`);
  }
  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
