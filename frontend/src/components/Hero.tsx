"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Play, Sparkles, Wand2, Zap } from "lucide-react";
import { PosterThumbnail } from "@/components/poster/PosterCanvas";
import { Badge } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { MOCK_TEMPLATES } from "@/lib/mock-data";
import { useBuilderHref } from "@/lib/use-builder-href";
import type { PosterFormData } from "@/lib/types";

const HERO_FORM: PosterFormData = {
  occasionType: "victory-day",
  headline: "Great Victory Day",
  name: "Martyred Heroes",
  designation: "Remembered",
  organization: "Bangladesh",
  unionThanaJela: "1971",
  partyName: "",
  promoteBy: "Promoted by — Sonar Bangla",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} as const;

const STATS = [
  { value: "10,000+", label: "Posters Created" },
  { value: "50+", label: "Ready Templates" },
  { value: "3 Seconds", label: "Render Time" },
] as const;

export function Hero() {
  const heroTemplate = MOCK_TEMPLATES[0];
  const builderHref = useBuilderHref();

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-7">
          <motion.div variants={item}>
            <span className="glass-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#FFC107]">
              <Sparkles className="size-3.5" />
              <span>Powered by Gemini AI</span>
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Your Political Poster,
            <br />
            <span className="text-gradient-brand">Created in Seconds</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-xl text-base leading-relaxed text-white/60 sm:text-lg"
          >
            Upload photos, enter text — AI automatically arranges colors, motifs,
            and layout. Victory Day, election campaigns, or greetings — with
            pixel-perfect typography (1200×1600 HD posters).
          </motion.p>

          <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={builderHref}>
              <Button
                variant="gold"
                size="lg"
                fullWidth
                leftIcon={<Wand2 className="size-5" />}
                rightIcon={<ArrowRight className="size-5" />}
              >
                <span>Start Creating Poster</span>
              </Button>
            </Link>
            <Link href="/templates">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                leftIcon={<Play className="size-4" />}
              >
                <span>View Templates</span>
              </Button>
            </Link>
          </motion.div>

          <motion.dl
            variants={item}
            className="grid max-w-lg grid-cols-3 gap-4 border-t border-white/[0.07] pt-6"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs text-white/40">{stat.label}</dt>
                <dd className="mt-0.5 text-xl font-extrabold text-white">
                  {stat.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-[#006A4E]/40 via-transparent to-[#FFC107]/25 blur-2xl" />

          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0D1117] shadow-2xl shadow-black/60"
          >
            <div className="aspect-[3/4]">
              <PosterThumbnail layout={heroTemplate.layoutConfig} formData={HERO_FORM} />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#0D1117] to-transparent px-4 pb-4 pt-12">
              <Badge tone="gold">
                <Zap className="size-3" /> AI Layout
              </Badge>
              <span className="text-[0.7rem] text-white/60">1200×1600 HD</span>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="glass-card absolute -left-4 top-10 hidden items-center gap-2 rounded-2xl px-3.5 py-2.5 sm:flex"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-gold-gradient text-[#0D1117]">
              <Sparkles className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-bold text-white">Bangla Typography</p>
              <p className="text-[0.65rem] text-white/45">Pixel-perfect conjuncts</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
            className="glass-card absolute -right-3 bottom-24 hidden items-center gap-2 rounded-2xl px-3.5 py-2.5 sm:flex"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-gradient text-white">
              <Zap className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-bold text-white">Fast Export</p>
              <p className="text-[0.65rem] text-white/45">PNG • PDF</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
