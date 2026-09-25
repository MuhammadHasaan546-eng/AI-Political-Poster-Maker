import { connectDatabase, disconnectDatabase } from './config/db';
import { logEnvWarnings } from './config/env';
import { Template } from './models';
import { TEMPLATE_SEEDS } from './services/template-seeds';

/**
 * Seed the template library with the production-ready Bangladeshi poster
 * templates (Victory Day, Condolence, Election Campaign, Eid, Independence Day).
 *
 * Idempotent: existing templates are cleared first so re-running produces a
 * clean, predictable library. Run with `npm run seed`.
 *
 * The template definitions live in `services/template-seeds.ts` so the admin
 * "seed" endpoint inserts byte-for-byte identical documents.
 */

async function run(): Promise<void> {
  logEnvWarnings();
  await connectDatabase();

  const removed = await Template.deleteMany({});
  console.log(`[seed] Removed ${removed.deletedCount ?? 0} existing template(s).`);

  const created = await Template.insertMany(TEMPLATE_SEEDS, { ordered: false });
  console.log(`[seed] Inserted ${created.length} template(s):`);
  for (const doc of created) {
    console.log(`  - ${doc.id}  ${doc.occasionType}  "${doc.name}"`);
  }

  await disconnectDatabase();
  console.log('[seed] Done.');
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[seed] Failed: ${message}`);
  process.exitCode = 1;
});
