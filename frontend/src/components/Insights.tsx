"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { apiGetTemplates } from "@/lib/api-client";
import { MOCK_TEMPLATES } from "@/lib/mock-data";
import type { Template } from "@/lib/types";

/** Occasion showcase — a curated slice of the template library. */
export function Insights() {
  // Start with the bundled mocks (instant paint), then swap in the live
  // library so every card links to a real Mongo ObjectId `/builder/<id>`.
  const [templates, setTemplates] = useState<Template[]>(() =>
    MOCK_TEMPLATES.slice(0, 4),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await apiGetTemplates();
        const active = list.filter((template) => template.isActive);
        if (!cancelled && active.length > 0) setTemplates(active.slice(0, 4));
      } catch {
        // Backend unreachable — keep the bundled mocks.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="templates" className="relative px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-[1360px]">
        <Reveal className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC107]">
              Template Library
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready for Every Occasion
            </h2>
            <p className="mt-3 text-base leading-relaxed text-white/55">
              Victory Day, tribute and remembrance, election campaigns, or greetings —
              pick the template you need and customize it instantly.
            </p>
          </div>
          <Link
            href="/templates"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#FFC107]/50 hover:text-[#FFC107]"
          >
            <span>All Templates</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {templates.map((template, index) => (
            <TemplateCard key={template.id} template={template} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
