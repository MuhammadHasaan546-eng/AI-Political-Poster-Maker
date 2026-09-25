import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import type { CreativeBrief } from '../types/brief';
import type { OccasionType } from '../types/domain';

/**
 * AI art-direction service.
 *
 * Produces a loosely-structured {@link CreativeBrief} describing palette, mood
 * and motifs for a poster. When Gemini is unavailable (no key, network failure,
 * malformed output) a deterministic heuristic brief is returned instead, so the
 * render pipeline never depends on a live model.
 */

export interface BriefRequest {
  occasionType: OccasionType;
  headline: string;
  name?: string;
  designation?: string;
  organization?: string;
  partyName?: string;
  unionThanaJela?: string;
}

export interface BriefResult {
  brief: CreativeBrief;
  latencyMs: number;
  prompt: string;
}

/* ------------------------------------------------------------------ *
 * Heuristic fallback.
 * ------------------------------------------------------------------ */

const HEURISTIC_PALETTES: Record<OccasionType, string[]> = {
  general: ['#006A4E', '#FFC107', '#0D1117'],
  eid: ['#0F5132', '#FFD166', '#064E3B'],
  ramadan: ['#0B3B2E', '#D4AF37', '#052E22'],
  'independence-day': ['#006A4E', '#F42A41', '#0D1117'],
  'victory-day': ['#006A4E', '#FFC107', '#0D1117'],
  'political-rally': ['#006A4E', '#F42A41', '#FFC107'],
  'election-campaign': ['#006A4E', '#F42A41', '#FFC107'],
  condolence: ['#0D1117', '#374151', '#9CA3AF'],
  congratulation: ['#0F5132', '#FFD166', '#064E3B'],
  birthday: ['#7C3AED', '#EC4899', '#F97316'],
};

const HEURISTIC_MOTIFS: Record<OccasionType, string[]> = {
  general: ['flag', 'paddy', 'star'],
  eid: ['crescent', 'floral', 'star'],
  ramadan: ['crescent', 'floral', 'lantern'],
  'independence-day': ['flag', 'star', 'paddy'],
  'victory-day': ['flag', 'paddy', 'dove', 'star'],
  'political-rally': ['flag', 'star', 'floral'],
  'election-campaign': ['flag', 'star', 'floral'],
  condolence: ['dove', 'floral', 'wreath'],
  congratulation: ['floral', 'star', 'ribbon'],
  birthday: ['balloon', 'confetti', 'star'],
};

const SOLEMN_MARKERS = ['শোক', 'স্মরণ', 'দোয়া', 'মরহুম', 'প্রয়াত', 'দুঃখ'];
const CELEBRATORY_MARKERS = ['বিজয়', 'অভিনন্দন', 'শুভ', 'অভিনন্দন', 'উৎসব', 'ঈদ'];

const HEURISTIC_NOTES: Record<OccasionType, string> = {
  general: 'সাধারণ রাষ্ট্রীয় পোস্টার — সবুজ-সোনালি প্যালেট ও ভারসাম্যপূর্ণ কম্পোজিশন।',
  eid: 'ঈদ উপলক্ষে উষ্ণ সবুজ-সোনালি প্যালেট, চাঁদ ও ফুলের মোটিফ।',
  ramadan: 'রমজানের আধ্যাত্মিক আবহ — গাঢ় সবুজ ও সোনালি, চাঁদ ও লণ্ঠন।',
  'independence-day': 'স্বাধীনতা দিবসের জাতীয় চেতনা — সবুজ-লাল পতাকা রঙ।',
  'victory-day': 'মহান বিজয় দিবস — জাতীয় পতাকা, ধান ও শান্তির প্রতীক।',
  'political-rally': 'জনসভা/মিছিলের প্রচার — দলীয় রঙে উচ্চ-কনট্রাস্ট শিরোনাম।',
  'election-campaign': 'নির্বাচনী প্রচার — শক্তিশালী বোল্ড টাইপোগ্রাফি ও দলীয় প্রতীক।',
  condolence: 'শোক ও স্মরণ — সংযত মিউটেড প্যালেট, শান্ত ফন্ট ও ফুলের মালা।',
  congratulation: 'অভিনন্দন বার্তা — উষ্ণ সোনালি ও সবুজ, উৎসবমুখর মোটিফ।',
  birthday: 'শুভ জন্মদিন — রঙিন স্নিগ্ধ প্যালেট ও উৎসবের মোটিফ।',
};

function detectMood(occasionType: OccasionType, headline: string): string {
  if (occasionType === 'condolence') return 'solemn';
  if (SOLEMN_MARKERS.some((marker) => headline.includes(marker))) return 'solemn';
  if (occasionType === 'birthday') return 'festive';
  if (CELEBRATORY_MARKERS.some((marker) => headline.includes(marker))) return 'celebratory';
  if (occasionType === 'election-campaign' || occasionType === 'political-rally') return 'assertive';
  return 'patriotic';
}

/** Build the deterministic fallback brief. Never throws. */
export function heuristicBrief(req: BriefRequest): CreativeBrief {
  const palette = HEURISTIC_PALETTES[req.occasionType] ?? HEURISTIC_PALETTES.general;
  const motifs = HEURISTIC_MOTIFS[req.occasionType] ?? HEURISTIC_MOTIFS.general;
  const mood = detectMood(req.occasionType, req.headline);

  return {
    theme: `${req.occasionType} — ${mood}`,
    mood,
    palette,
    motifs,
    backgroundPrompt: `${mood} Bangladeshi political poster background, ${req.occasionType}, ${palette.join(' ')}, ornate floral border`,
    compositionNotes: HEURISTIC_NOTES[req.occasionType] ?? HEURISTIC_NOTES.general,
    typographyNotes: 'বড় বোল্ড বাংলা হেডলাইন, নিচে হালকা সাব-হেডলাইন, সর্বনিম্ন ৯০px।',
    headlineSuggestion: req.headline,
    subheadlineSuggestion: req.occasionType === 'condolence' ? 'গভীর শ্রদ্ধাঞ্জলি' : 'উপলক্ষে শুভেচ্ছা',
    generatedBy: 'heuristic',
    model: 'deterministic',
  };
}

/* ------------------------------------------------------------------ *
 * Gemini client (lazy singleton).
 * ------------------------------------------------------------------ */

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!env.HAS_GEMINI || !env.GEMINI_API_KEY) return null;
  if (!client) {
    // NOTE: the Gemini API backend (API-key auth) does NOT accept `project` /
    // `location` — those are Vertex-only and make the constructor throw
    // ("Project and location are not supported for Gemini API backend").
    // The project id/number are therefore recorded for attribution/logging
    // only, while authentication itself is carried by the API key.
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    console.log(
      `[gemini] Client initialised (model=${env.GEMINI_TEXT_MODEL}` +
        (env.GEMINI_PROJECT_NUMBER ? `, project=${env.GEMINI_PROJECT_NUMBER}` : '') +
        ').',
    );
  }
  return client;
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    theme: { type: 'string' },
    mood: { type: 'string' },
    palette: { type: 'array', items: { type: 'string' } },
    motifs: { type: 'array', items: { type: 'string' } },
    backgroundPrompt: { type: 'string' },
    compositionNotes: { type: 'string' },
    typographyNotes: { type: 'string' },
    headlineSuggestion: { type: 'string' },
    subheadlineSuggestion: { type: 'string' },
  },
  required: ['palette', 'mood'],
} as const;

function buildPrompt(req: BriefRequest): string {
  return [
    'You are an expert art director for Bangladeshi political and ceremonial posters.',
    'Return ONLY JSON matching the provided schema. All prose must be in Bangla (Bengali).',
    `Occasion: ${req.occasionType}`,
    `Headline (Bangla): ${req.headline}`,
    req.name ? `Subject name: ${req.name}` : '',
    req.designation ? `Designation: ${req.designation}` : '',
    req.partyName ? `Party: ${req.partyName}` : '',
    req.organization ? `Organization: ${req.organization}` : '',
    req.unionThanaJela ? `Area: ${req.unionThanaJela}` : '',
    'Provide 3 hex colors (primary, accent, dark), 2-4 motif ids from:',
    'flag, star, paddy, dove, floral, crescent, lantern, wreath, ribbon, balloon, confetti.',
    'Respect cultural tone: condolence must be solemn and muted; victory day patriotic green/gold/red.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Coerce unknown model output into a valid partial brief, dropping junk. */
function sanitiseBrief(raw: unknown, req: BriefRequest): CreativeBrief | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;

  const asString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  const asStringArray = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const items = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    return items.length > 0 ? items.slice(0, 6) : undefined;
  };

  const palette = asStringArray(record['palette']);
  const brief: CreativeBrief = {
    theme: asString(record['theme']),
    mood: asString(record['mood']),
    palette,
    motifs: asStringArray(record['motifs']),
    backgroundPrompt: asString(record['backgroundPrompt']),
    compositionNotes: asString(record['compositionNotes']),
    typographyNotes: asString(record['typographyNotes']),
    headlineSuggestion: asString(record['headlineSuggestion']) ?? req.headline,
    subheadlineSuggestion: asString(record['subheadlineSuggestion']),
    generatedBy: 'gemini',
    model: env.GEMINI_TEXT_MODEL,
  };

  // A brief with neither palette nor mood carries no signal — treat as invalid.
  if (!brief.palette && !brief.mood) return null;
  return brief;
}

/**
 * Request a creative brief, falling back to the heuristic on any failure.
 * Never throws.
 */
export async function generateBrief(req: BriefRequest): Promise<BriefResult> {
  const prompt = buildPrompt(req);
  const ai = getClient();

  if (!ai) {
    return { brief: heuristicBrief(req), latencyMs: 0, prompt };
  }

  const startedAt = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: env.GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
        temperature: 0.9,
      },
    });

    const text = typeof response.text === 'string' ? response.text : '';
    const parsed = text ? (JSON.parse(text) as unknown) : null;
    const brief = sanitiseBrief(parsed, req);

    if (!brief) {
      console.warn('[gemini] Model returned an unusable brief; using heuristic fallback.');
      return { brief: heuristicBrief(req), latencyMs: Date.now() - startedAt, prompt };
    }

    return { brief, latencyMs: Date.now() - startedAt, prompt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[gemini] Brief generation failed (${message}); using heuristic fallback.`);
    return { brief: heuristicBrief(req), latencyMs: Date.now() - startedAt, prompt };
  }
}
