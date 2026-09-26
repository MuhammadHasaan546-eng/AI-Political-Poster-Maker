import { promises as fs } from 'node:fs';
import path from 'node:path';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env, logEnvWarnings } from './config/env';
import { GenerationLog, Poster, Template, User } from './models';
import { renderPosterPng } from './services/render';
import { runGeneration } from './services/generation';
import { createStorage, ensureStorageReady, STORAGE_ROOT } from './services/storage';
import { hashPassword } from './services/auth';
import type { LayoutConfig } from './types/layout';

/**
 * End-to-end smoke test for the generation pipeline.
 *
 * Boots the (in-memory) database, seeds a template, generates a poster through
 * the real Gemini/heuristic -> layout -> Chrome -> storage pipeline, and asserts
 * the output is a print-ready 2400x3200 PNG.
 *
 * Run:  MONGODB_URI="" DEV_IN_MEMORY_DB=true JWT_SECRET=test-secret npx tsx src/verify.ts
 */

let failures = 0;

function check(label: string, condition: boolean, detail = ''): void {
  const mark = condition ? 'PASS' : 'FAIL';
  if (!condition) failures += 1;
  console.log(`  [${mark}] ${label}${detail ? ` -> ${detail}` : ''}`);
}

/** Read width/height from a PNG IHDR chunk (bytes 16..24, big-endian). */
function pngDimensions(buffer: Buffer): { width: number; height: number } {
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') throw new Error('Not a PNG buffer.');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const SAMPLE_LAYOUT: LayoutConfig = {
  canvas: { w: 1200, h: 1600 },
  background: {
    type: 'gradient',
    colors: ['#006A4E', '#FFC107', '#06130E'],
    motifIds: ['flag', 'paddy', 'dove', 'star'],
  },
  photoSlots: [
    { id: 'portrait', x: 350, y: 250, w: 500, h: 540, shape: 'arch', borderColor: '#FFC107', borderWidth: 14 },
  ],
  textSlots: [
    {
      id: 'headline',
      key: 'headline',
      x: 600,
      y: 850,
      maxWidth: 1040,
      fontFamily: 'Noto Serif Bengali',
      fontSize: 94,
      color: '#FFFFFF',
      align: 'center',
      lineHeight: 1.15,
    },
    {
      id: 'subheadline',
      key: 'subheadline',
      x: 600,
      y: 1030,
      maxWidth: 1040,
      fontFamily: 'Hind Siliguri',
      fontSize: 52,
      color: '#FFE9A8',
      align: 'center',
      lineHeight: 1.2,
    },
    {
      id: 'designation',
      key: 'designation',
      x: 600,
      y: 1150,
      maxWidth: 1040,
      fontFamily: 'Hind Siliguri',
      fontSize: 40,
      color: '#E5E7EB',
      align: 'center',
      lineHeight: 1.2,
    },
  ],
  footerBar: {
    y: 1450,
    h: 150,
    bg: '#04120C',
    textColor: '#F8FAFC',
    keys: ['organization', 'unionThanaJela', 'partyName', 'promoteBy'],
  },
};

async function run(): Promise<void> {
  console.log('\n=== AI Political Poster Maker — E2E verification ===\n');
  logEnvWarnings();

  console.log('\n[1] Storage driver');
  await ensureStorageReady();
  const storage = createStorage();
  check('storage driver resolved', Boolean(storage.name), storage.name);
  check('storage root exists', Boolean(STORAGE_ROOT), STORAGE_ROOT);

  console.log('\n[2] Database connection');
  await connectDatabase();
  check('database reachable', true, env.HAS_MONGODB_URI ? 'mongodb uri' : 'in-memory / degraded');

  console.log('\n[3] Direct Chrome render (1200x1600 @2x)');
  const directPng = await renderPosterPng({
    layout: SAMPLE_LAYOUT,
    form: {
      occasionType: 'victory-day',
      headline: 'Great Victory Day',
      name: 'Mohammad Ali',
      designation: 'President',
      organization: 'Central Committee',
      unionThanaJela: 'Savar, Dhaka',
      partyName: 'National Organization',
      promoteBy: 'Promoted by — Youth Organization',
    },
    photos: [],
  });
  const direct = pngDimensions(directPng);
  check('PNG is 2400x3200', direct.width === 2400 && direct.height === 3200, `${direct.width}x${direct.height}`);
  check('PNG is non-trivial in size', directPng.byteLength > 50_000, `${directPng.byteLength} bytes`);

  // Persist the direct render for manual visual inspection.
  const previewDir = path.resolve(process.cwd(), 'storage', 'preview');
  await fs.mkdir(previewDir, { recursive: true });
  const previewPath = path.join(previewDir, 'direct-render.png');
  await fs.writeFile(previewPath, directPng);
  console.log(`  [info] wrote ${previewPath}`);

  if (!env.HAS_MONGODB_URI && !env.DEV_IN_MEMORY_DB) {
    console.log('\n[4] Skipping DB-backed generation (no database configured).');
    await disconnectDatabase();
    report();
    return;
  }

  console.log('\n[4] Seed template + user');
  await Poster.deleteMany({});
  await Template.deleteMany({});
  await User.deleteMany({});

  const template = await Template.create({
    name: 'Great Victory Day — Verification',
    occasionType: 'victory-day',
    thumbnailUrl: '',
    isActive: true,
    layoutConfig: SAMPLE_LAYOUT,
  });
  check('template created', Boolean(template.id), template.id as string);

  const user = await User.create({
    name: 'Verification User',
    email: 'verify@poster.local',
    passwordHash: await hashPassword('verify123'),
    role: 'user',
  });

  console.log('\n[5] Full generation through the orchestrator');
  const poster = await Poster.create({
    userId: user._id,
    templateId: template._id,
    status: 'pending',
    occasionType: 'victory-day',
    headline: 'Great Victory Day',
    name: 'Mohammad Ali',
    designation: 'President',
    organization: 'Central Committee',
    unionThanaJela: 'Savar, Dhaka',
    partyName: 'National Organization',
    promoteBy: 'Promoted by — Youth Organization',
    photoUrls: [],
  });

  const startedAt = Date.now();
  const result = await runGeneration(poster.id as string);
  const elapsed = Date.now() - startedAt;
  check('generation succeeded', result.success, result.errorMessage ?? `in ${elapsed}ms`);

  const reloaded = await Poster.findById(poster.id);
  check('poster status completed', reloaded?.status === 'completed', reloaded?.status ?? 'missing');
  check('image url persisted', Boolean(reloaded?.generatedImageUrl), reloaded?.generatedImageUrl ?? '');
  check('pdf url persisted', Boolean(reloaded?.pdfUrl), reloaded?.pdfUrl ?? '');
  check('layout snapshot stored', Boolean(reloaded?.layoutSnapshot));
  check(
    'creative brief stored',
    Boolean(reloaded?.creativeBrief),
    String((reloaded?.creativeBrief as { generatedBy?: string } | undefined)?.generatedBy ?? ''),
  );

  console.log('\n[6] Verify persisted artifacts on disk');
  const imageUrl = reloaded?.generatedImageUrl ?? '';
  const relative = imageUrl.includes('/storage/') ? imageUrl.split('/storage/')[1] : '';
  if (relative) {
    const absolute = path.join(STORAGE_ROOT, decodeURIComponent(relative));
    const bytes = await fs.readFile(absolute);
    const dims = pngDimensions(bytes);
    check('stored PNG is 2400x3200', dims.width === 2400 && dims.height === 3200, `${dims.width}x${dims.height}`);
    check('stored PNG non-trivial', bytes.byteLength > 50_000, `${bytes.byteLength} bytes`);

    // Persist the orchestrator artifact for manual visual inspection.
    const orchestratorPreview = path.join(previewDir, 'orchestrator-render.png');
    await fs.writeFile(orchestratorPreview, bytes);
    console.log(`  [info] wrote ${orchestratorPreview}`);
  } else {
    check('stored PNG resolvable', false, `unexpected url: ${imageUrl}`);
  }

  const pdfUrl = reloaded?.pdfUrl ?? '';
  if (pdfUrl.includes('/storage/')) {
    const absolute = path.join(STORAGE_ROOT, decodeURIComponent(pdfUrl.split('/storage/')[1]));
    const bytes = await fs.readFile(absolute);
    check('stored PDF has %PDF header', bytes.subarray(0, 4).toString() === '%PDF', `${bytes.byteLength} bytes`);
  }

  console.log('\n[7] Generation telemetry');
  const logs = await GenerationLog.find({});
  check('generation log written', logs.length >= 1, `${logs.length} entry(ies)`);
  check('log marked success', logs.some((log) => log.success));

  console.log('\n[8] Cleanup');
  await disconnectDatabase();

  report(previewPath);
}

function report(previewPath?: string): void {
  console.log('\n=== RESULT ===');
  if (failures === 0) {
    console.log('ALL CHECKS PASSED');
    if (previewPath) console.log(`Preview artifact: ${previewPath}`);
  } else {
    console.log(`${failures} CHECK(S) FAILED`);
    process.exitCode = 1;
  }
  console.log('==============\n');
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[verify] Fatal: ${message}`);
  process.exitCode = 1;
});
