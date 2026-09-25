import { connectDatabase, disconnectDatabase } from './config/db';
import { logEnvWarnings } from './config/env';
import { Template } from './models';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type LayoutConfig } from './types/layout';

/**
 * Seed the template library with three production-ready Bangladeshi poster
 * templates: Victory Day, Condolence, and Election Campaign.
 *
 * Idempotent: existing templates are cleared first so re-running produces a
 * clean, predictable library. Run with `npm run seed`.
 */

/** Common canvas + footer defaults shared by every template. */
function baseLayout(overrides: Partial<LayoutConfig>): LayoutConfig {
  return {
    canvas: { w: CANVAS_WIDTH, h: CANVAS_HEIGHT },
    background: {
      type: 'gradient',
      colors: ['#006A4E', '#FFC107', '#06130E'],
      motifIds: ['flag', 'paddy', 'dove', 'star'],
    },
    photoSlots: [
      {
        id: 'portrait',
        x: 350,
        y: 250,
        w: 500,
        h: 540,
        shape: 'arch',
        borderColor: '#FFC107',
        borderWidth: 14,
      },
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
    ...overrides,
  };
}

/** 1. Victory Day — patriotic green/gold with flag, paddy and doves. */
const victoryDay = baseLayout({
  background: {
    type: 'gradient',
    colors: ['#006A4E', '#0A8A67', '#06130E'],
    motifIds: ['flag', 'paddy', 'dove', 'star', 'floral'],
  },
  photoSlots: [
    {
      id: 'portrait',
      x: 350,
      y: 240,
      w: 500,
      h: 540,
      shape: 'arch',
      borderColor: '#FFC107',
      borderWidth: 16,
    },
  ],
});

/** 2. Condolence — muted slate palette with doves, wreath and florals. */
const condolence = baseLayout({
  background: {
    type: 'gradient',
    colors: ['#0D1117', '#1F2937', '#0B3B2E'],
    motifIds: ['dove', 'wreath', 'floral'],
  },
  photoSlots: [
    {
      id: 'portrait',
      x: 380,
      y: 260,
      w: 440,
      h: 440,
      shape: 'circle',
      borderColor: '#D1D5DB',
      borderWidth: 12,
    },
  ],
  textSlots: [
    {
      id: 'headline',
      key: 'headline',
      x: 600,
      y: 800,
      maxWidth: 1040,
      fontFamily: 'Noto Serif Bengali',
      fontSize: 88,
      color: '#FFFFFF',
      align: 'center',
      lineHeight: 1.18,
    },
    {
      id: 'subheadline',
      key: 'subheadline',
      x: 600,
      y: 980,
      maxWidth: 1040,
      fontFamily: 'Noto Serif Bengali',
      fontSize: 48,
      color: '#9CA3AF',
      align: 'center',
      lineHeight: 1.25,
    },
    {
      id: 'designation',
      key: 'designation',
      x: 600,
      y: 1120,
      maxWidth: 1040,
      fontFamily: 'Hind Siliguri',
      fontSize: 38,
      color: '#E5E7EB',
      align: 'center',
      lineHeight: 1.2,
    },
  ],
  footerBar: {
    y: 1450,
    h: 150,
    bg: '#0B1220',
    textColor: '#E5E7EB',
    keys: ['organization', 'unionThanaJela', 'partyName'],
  },
});

/** 3. Election Campaign — bold dual-portrait layout with strong party colors. */
const electionCampaign = baseLayout({
  background: {
    type: 'gradient',
    colors: ['#006A4E', '#F42A41', '#0B1220'],
    motifIds: ['flag', 'star', 'floral', 'paddy'],
  },
  photoSlots: [
    {
      id: 'leader-left',
      x: 90,
      y: 300,
      w: 400,
      h: 480,
      shape: 'circle',
      borderColor: '#FFC107',
      borderWidth: 14,
    },
    {
      id: 'leader-right',
      x: 710,
      y: 300,
      w: 400,
      h: 480,
      shape: 'circle',
      borderColor: '#FFC107',
      borderWidth: 14,
    },
  ],
  textSlots: [
    {
      id: 'headline',
      key: 'headline',
      x: 600,
      y: 840,
      maxWidth: 1080,
      fontFamily: 'Hind Siliguri',
      fontSize: 104,
      color: '#FFFFFF',
      align: 'center',
      lineHeight: 1.1,
    },
    {
      id: 'subheadline',
      key: 'subheadline',
      x: 600,
      y: 1020,
      maxWidth: 1080,
      fontFamily: 'Hind Siliguri',
      fontSize: 56,
      color: '#FFE9A8',
      align: 'center',
      lineHeight: 1.2,
    },
    {
      id: 'designation',
      key: 'designation',
      x: 600,
      y: 1160,
      maxWidth: 1080,
      fontFamily: 'Hind Siliguri',
      fontSize: 42,
      color: '#E5E7EB',
      align: 'center',
      lineHeight: 1.2,
    },
  ],
});

const TEMPLATES = [
  {
    name: 'মহান বিজয় দিবস — জাতীয় শ্রদ্ধা',
    occasionType: 'victory-day' as const,
    thumbnailUrl: '',
    isActive: true,
    layoutConfig: victoryDay,
  },
  {
    name: 'শোক ও স্মরণ — গভীর শ্রদ্ধাঞ্জলি',
    occasionType: 'condolence' as const,
    thumbnailUrl: '',
    isActive: true,
    layoutConfig: condolence,
  },
  {
    name: 'নির্বাচনী প্রচার — দ্বৈত প্রতিকৃতি',
    occasionType: 'election-campaign' as const,
    thumbnailUrl: '',
    isActive: true,
    layoutConfig: electionCampaign,
  },
];

async function run(): Promise<void> {
  logEnvWarnings();
  await connectDatabase();

  const removed = await Template.deleteMany({});
  console.log(`[seed] Removed ${removed.deletedCount ?? 0} existing template(s).`);

  const created = await Template.insertMany(TEMPLATES);
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
