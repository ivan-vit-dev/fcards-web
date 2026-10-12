/**
 * Seeds initial card templates into Firestore. Safe to re-run.
 * Run with: npm run seed:templates  (or use "Nahrát výchozí data" in /admin)
 */
import { connectAsAdmin, upsert } from "./seed-client";
import { SEED_TEMPLATES } from "../src/lib/seedData";

async function seed() {
  const db = await connectAsAdmin();
  console.log("Seeding templates...");
  for (const { id, ...tpl } of SEED_TEMPLATES) {
    const result = await upsert(db, "templates", id, tpl);
    console.log(`  ✓ ${tpl.nameCs} (${id}, ${result})`);
  }
  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
