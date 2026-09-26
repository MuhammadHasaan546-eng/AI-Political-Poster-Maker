import type { LayoutConfig, OccasionType, Template } from "./types";

/** A 1200x1600 baseline layout reused by every mock template. */
function buildLayout(overrides: Partial<LayoutConfig> = {}): LayoutConfig {
  const base: LayoutConfig = {
    canvas: { w: 1200, h: 1600 },
    background: {
      type: "gradient",
      colors: ["#006A4E", "#004D38", "#0D1117"],
      motifIds: ["flag", "paddy", "dove"],
    },
    photoSlots: [
      {
        id: "portrait",
        x: 350,
        y: 260,
        w: 500,
        h: 520,
        shape: "arch",
        borderColor: "#FFC107",
        borderWidth: 14,
      },
    ],
    textSlots: [
      {
        id: "headline",
        key: "headline",
        x: 600,
        y: 860,
        maxWidth: 1040,
        fontFamily: "Hind Siliguri",
        fontSize: 92,
        color: "#FFFFFF",
        align: "center",
        lineHeight: 1.15,
      },
      {
        id: "subheadline",
        key: "subheadline",
        x: 600,
        y: 1020,
        maxWidth: 1040,
        fontFamily: "Noto Serif Bengali",
        fontSize: 50,
        color: "#FFC107",
        align: "center",
        lineHeight: 1.2,
      },
      {
        id: "designation",
        key: "designation",
        x: 600,
        y: 1140,
        maxWidth: 1040,
        fontFamily: "Hind Siliguri",
        fontSize: 40,
        color: "#E5E7EB",
        align: "center",
        lineHeight: 1.2,
      },
    ],
    footerBar: {
      y: 1440,
      h: 160,
      bg: "#0D1117",
      textColor: "#FFFFFF",
      keys: ["organization", "unionThanaJela", "partyName", "promoteBy"],
    },
  };

  return { ...base, ...overrides };
}

export const MOCK_TEMPLATES: Template[] = [
  {
    id: "tpl-victory-classic",
    title: "Great Victory Day — Classic",
    occasionType: "victory-day",
    thumbnailUrl: "",
    badge: "Popular",
    isActive: true,
    layoutConfig: buildLayout(),
  },
  {
    id: "tpl-victory-gold",
    title: "Victory Day — Golden Frame",
    occasionType: "victory-day",
    thumbnailUrl: "",
    badge: "New",
    isActive: true,
    layoutConfig: buildLayout({
      background: {
        type: "gradient",
        colors: ["#004D38", "#FFC107", "#0D1117"],
        motifIds: ["flag", "paddy"],
      },
      photoSlots: [
        {
          id: "portrait",
          x: 360,
          y: 240,
          w: 480,
          h: 520,
          shape: "circle",
          borderColor: "#FFFFFF",
          borderWidth: 12,
        },
      ],
    }),
  },
  {
    id: "tpl-tribute-solemn",
    title: "Tribute & Remembrance — Dedication",
    occasionType: "condolence",
    thumbnailUrl: "",
    isActive: true,
    layoutConfig: buildLayout({
      background: {
        type: "gradient",
        colors: ["#0D1117", "#1F2937", "#004D38"],
        motifIds: ["dove", "floral"],
      },
      textSlots: [
        {
          id: "headline",
          key: "headline",
          x: 600,
          y: 880,
          maxWidth: 1040,
          fontFamily: "Noto Serif Bengali",
          fontSize: 88,
          color: "#FFFFFF",
          align: "center",
          lineHeight: 1.18,
        },
        {
          id: "subheadline",
          key: "subheadline",
          x: 600,
          y: 1030,
          maxWidth: 1040,
          fontFamily: "Noto Serif Bengali",
          fontSize: 48,
          color: "#9CA3AF",
          align: "center",
          lineHeight: 1.25,
        },
        {
          id: "designation",
          key: "designation",
          x: 600,
          y: 1150,
          maxWidth: 1040,
          fontFamily: "Hind Siliguri",
          fontSize: 38,
          color: "#E5E7EB",
          align: "center",
          lineHeight: 1.2,
        },
      ],
    }),
  },
  {
    id: "tpl-campaign-bold",
    title: "Election Campaign — Bold",
    occasionType: "election-campaign",
    thumbnailUrl: "",
    badge: "Campaign",
    isActive: true,
    layoutConfig: buildLayout({
      background: {
        type: "gradient",
        colors: ["#006A4E", "#F42A41", "#0D1117"],
        motifIds: ["flag", "star"],
      },
      photoSlots: [
        {
          id: "portrait",
          x: 320,
          y: 250,
          w: 560,
          h: 500,
          shape: "rect",
          borderColor: "#FFC107",
          borderWidth: 16,
        },
      ],
    }),
  },
  {
    id: "tpl-campaign-rally",
    title: "Rally Invitation — Public Meeting",
    occasionType: "political-rally",
    thumbnailUrl: "",
    isActive: true,
    layoutConfig: buildLayout({
      background: {
        type: "gradient",
        colors: ["#004D38", "#0A8A67", "#FFC107"],
        motifIds: ["paddy", "flag"],
      },
    }),
  },
  {
    id: "tpl-greetings-eid",
    title: "Eid Greetings — Festival",
    occasionType: "eid",
    thumbnailUrl: "",
    isActive: true,
    layoutConfig: buildLayout({
      background: {
        type: "gradient",
        colors: ["#0D1117", "#006A4E", "#FFC107"],
        motifIds: ["crescent", "floral", "star"],
      },
      photoSlots: [
        {
          id: "portrait",
          x: 380,
          y: 280,
          w: 440,
          h: 440,
          shape: "circle",
          borderColor: "#FFC107",
          borderWidth: 12,
        },
      ],
    }),
  },
  {
    id: "tpl-greetings-puja",
    title: "Greetings — Festival of Lights",
    occasionType: "congratulation",
    thumbnailUrl: "",
    isActive: true,
    layoutConfig: buildLayout({
      background: {
        type: "gradient",
        colors: ["#F42A41", "#FFC107", "#0D1117"],
        motifIds: ["floral", "star"],
      },
    }),
  },
];

/** Preset headlines surfaced in the builder. */
export const PRESET_HEADLINES = [
  "Great Victory Day",
  "Take Back Bangladesh",
  "Golden Jubilee of Independence",
  "In Memory of the Martyrs",
  "Happy Eid Mubarak",
  "Eid al-Adha Mubarak",
  "Welcome to the Public Meeting",
  "Vote for the Boat",
  "Election Campaign Rally",
  "Happy New Year",
] as const;

export function getTemplateById(id: string): Template | undefined {
  return MOCK_TEMPLATES.find((template) => template.id === id);
}

export function filterTemplates(
  templates: Template[],
  occasion: OccasionType | "all",
): Template[] {
  if (occasion === "all") return templates;
  return templates.filter((template) => template.occasionType === occasion);
}
