"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { PosterStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ProgressStepDef {
  id: string;
  label: string;
  detail: string;
}

/** The staged pipeline surfaced to the user while the AI renders. */
export const GENERATION_STEPS: ProgressStepDef[] = [
  { id: "analyze", label: "Analyzing photos…", detail: "Analyzing uploaded photos" },
  { id: "theme", label: "Selecting theme & colors…", detail: "Selecting palette & motifs" },
  { id: "bangla", label: "Formatting Bangla text…", detail: "Formatting Bangla typography" },
  { id: "render", label: "Rendering HD poster…", detail: "Rendering HD poster" },
];

export interface GenerationProgressProps {
  status: PosterStatus;
  /** Optional externally-driven step index; otherwise auto-advances. */
  stepIndex?: number;
  className?: string;
}

/**
 * Animated multi-step progress panel shown during poster generation.
 * Auto-advances through the pipeline while `status === "generating"`.
 */
export function GenerationProgress({
  status,
  stepIndex,
  className,
}: GenerationProgressProps) {
  const [internalStep, setInternalStep] = useState(0);
  const steps = GENERATION_STEPS.length;
  const active = stepIndex ?? internalStep;
  const done = status === "completed";
  const failed = status === "failed";

  useEffect(() => {
    if (status !== "generating") return;
    setInternalStep(0);
    const timer = window.setInterval(() => {
      setInternalStep((current) => (current >= steps - 1 ? current : current + 1));
    }, 1500);
    return () => window.clearInterval(timer);
  }, [status, steps]);

  const percent = done ? 100 : ((active + 0.5) / steps) * 100;

  return (
    <div
      className={cn(
        "glass-card relative overflow-hidden rounded-2xl p-5",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFC107]/70 to-transparent" />

      <div className="flex items-center gap-4">
        <ProgressRing value={percent} size={54} strokeWidth={5} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="size-4 text-[#FFC107]" />
            {done
              ? "Poster created successfully!"
              : failed
                ? "Could not create the poster"
                : "AI is creating your poster"}
          </p>
          <p className="font-bangla mt-0.5 truncate text-xs text-white/50">
            {done
              ? "You can download it now."
              : failed
                ? "Try again or change the details."
                : GENERATION_STEPS[Math.min(active, steps - 1)].detail}
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-2.5">
        {GENERATION_STEPS.map((step, index) => {
          const isDone = done || index < active;
          const isActive = !done && index === active;
          return (
            <li key={step.id} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-[0.65rem] font-bold transition-colors",
                  isDone && "border-[#FFC107]/50 bg-[#FFC107]/15 text-[#FFC107]",
                  isActive && "border-[#FFC107] bg-[#FFC107] text-[#0D1117]",
                  !isDone && !isActive && "border-white/12 text-white/30",
                )}
              >
                {isDone ? <CheckCircle2 className="size-3.5" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-bangla truncate text-[0.78rem]",
                    isActive || isDone ? "text-white/85" : "text-white/35",
                  )}
                >
                  {step.label}
                </p>
                {isActive && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.3, ease: "easeInOut" }}
                    className="mt-1 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#0A8A67] to-[#FFC107]"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-xl border border-emerald-400/25 bg-[#006A4E]/20 px-3 py-2 text-xs font-semibold text-emerald-200"
          >
            ✅ Render complete — save as PNG or PDF.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
