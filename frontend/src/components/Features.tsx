import {
  Frame,
  ImageUp,
  Languages,
  Palette,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Layout Suggestions",
    body: "Gemini reads the occasion and proposes colors, motifs, and frames for you — professional design in moments.",
  },
  {
    icon: Languages,
    title: "Pixel-perfect Bangla Typography",
    body: "Conjuncts render flawlessly with Hind Siliguri and Noto Serif Bengali — no broken glyphs.",
  },
  {
    icon: ImageUp,
    title: "Drag-and-drop Photo Upload",
    body: "Drop up to 3 photos, crop and frame them — with an automatic background preview.",
  },
  {
    icon: Frame,
    title: "Leader Photo Frames",
    body: "Place leader portraits in circular, arch, or rectangular frames — with golden borders.",
  },
  {
    icon: Palette,
    title: "National Color Palette",
    body: "Deep green, red, and gold — the traditional aesthetic of Bangladeshi posters.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first Design",
    body: "Field workers can create posters in seconds, right from their phones.",
  },
] as const;

export function Features() {
  return (
    <section id="features" className="relative px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-[1360px]">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC107]">
            Features
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Everything in One Place
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/55">
            Everything you need to design a poster — photos, text, frames, colors, and export.
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 0.08} className="h-full">
                <article className="group glass-card relative h-full overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FFC107]/35 hover:shadow-2xl hover:shadow-[#006A4E]/25">
                  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFC107]/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="grid size-12 place-items-center rounded-2xl bg-emerald-gradient text-white shadow-lg shadow-[#006A4E]/35">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="font-bangla mt-5 text-lg font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="font-bangla mt-2 text-sm leading-relaxed text-white/50">
                    {feature.body}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
