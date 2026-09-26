"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { PosterThumbnail } from "@/components/poster/PosterCanvas";
import { Badge } from "@/components/ui/Chip";
import { OCCASION_LABELS, type PosterFormData, type Template } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface TemplateCardProps {
  template: Template;
  className?: string;
  index?: number;
}

/** Preview copy so each thumbnail shows representative Bangla typography. */
function sampleFormData(template: Template): PosterFormData {
  return {
    occasionType: template.occasionType,
    headline: template.title.split("—")[0].trim(),
    name: "Mohammad Ali",
    designation: "President",
    organization: "Central Committee",
    unionThanaJela: "Savar, Dhaka",
    partyName: "National Organization",
    promoteBy: "Promoted by — Youth Organization",
  };
}

/** Template card with a live, data-driven canvas preview and hover CTA. */
export function TemplateCard({ template, className, index = 0 }: TemplateCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07, ease: "easeOut" }}
      className={cn(
        "group glass-card relative overflow-hidden rounded-3xl transition-all duration-300",
        "hover:-translate-y-1.5 hover:border-[#FFC107]/40 hover:shadow-2xl hover:shadow-[#006A4E]/30",
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#0D1117]">
        <PosterThumbnail
          layout={template.layoutConfig}
          formData={sampleFormData(template)}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {template.badge && (
          <span className="absolute left-3 top-3">
            <Badge tone="gold">{template.badge}</Badge>
          </span>
        )}

        <span className="absolute right-3 top-3">
          <Badge tone="emerald">{OCCASION_LABELS[template.occasionType]}</Badge>
        </span>

        <div className="absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/85 to-transparent p-4 pt-12 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Link
            href={`/builder/${template.id}`}
            className="flex items-center justify-between gap-2 rounded-xl bg-gold-gradient px-3.5 py-2.5 text-[0.8rem] font-bold text-[#0D1117] shadow-lg shadow-[#FFC107]/25"
          >
            <span>Create a Poster with This Template</span>
            <ArrowRight className="size-4 shrink-0" />
          </Link>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <h3 className="font-bangla line-clamp-2 text-sm font-bold leading-snug text-white">
          {template.title}
        </h3>
        <div className="flex items-center justify-between text-[0.7rem] text-white/45">
          <span className="flex items-center gap-1">
            <Sparkles className="size-3 text-[#FFC107]" />
            1200 × 1600 px
          </span>
          <span className="uppercase tracking-wider">
            {template.occasionType.replace("-", " ")}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/** Empty-state shown when a filter yields no templates. */
export function TemplateEmptyState() {
  return (
    <div className="glass-card col-span-full grid place-items-center rounded-3xl px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-white/[0.04]">
        <Sparkles className="size-6 text-[#FFC107]" />
      </span>
      <p className="mt-4 text-sm font-bold text-white">
        No templates found for this occasion
      </p>
      <p className="mt-1 text-xs text-white/45">
        Select another category or browse the general templates.
      </p>
    </div>
  );
}
