"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  /** Zero-based index of the active step. */
  current: number;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

/** Animated multi-step progress indicator used by the AI generation flow. */
export function Stepper({
  steps,
  current,
  className,
  orientation = "horizontal",
}: StepperProps) {
  const vertical = orientation === "vertical";

  return (
    <ol
      className={cn(
        "flex",
        vertical ? "flex-col gap-5" : "items-start justify-between gap-2",
        className,
      )}
    >
      {steps.map((step, index) => {
        const isDone = index < current;
        const isActive = index === current;

        return (
          <li
            key={step.id}
            className={cn(
              "relative flex",
              vertical ? "items-start gap-3" : "flex-1 flex-col items-center text-center",
            )}
            aria-current={isActive ? "step" : undefined}
          >
            <div className={cn("flex items-center", vertical ? "" : "w-full")}>
              {!vertical && index > 0 && (
                <span
                  className={cn(
                    "h-0.5 flex-1 transition-colors duration-500",
                    index <= current ? "bg-[#FFC107]/70" : "bg-white/10",
                  )}
                />
              )}
              <motion.span
                initial={false}
                animate={{ scale: isActive ? 1.06 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold",
                  isDone && "border-[#FFC107]/60 bg-gold-gradient text-[#0D1117]",
                  isActive &&
                    "border-[#FFC107] bg-[#FFC107]/15 text-[#FFC107] shadow-lg shadow-[#FFC107]/25",
                  !isDone && !isActive && "border-white/15 bg-white/[0.03] text-white/40",
                )}
              >
                {isDone ? <Check className="size-4" /> : index + 1}
              </motion.span>
              {!vertical && index < steps.length - 1 && (
                <span
                  className={cn(
                    "h-0.5 flex-1 transition-colors duration-500",
                    index < current ? "bg-[#FFC107]/70" : "bg-white/10",
                  )}
                />
              )}
            </div>

            <div className={cn(vertical ? "pt-0.5" : "mt-2 px-1")}>
              <p
                className={cn(
                  "text-xs font-semibold leading-tight",
                  isActive || isDone ? "text-white" : "text-white/45",
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="mt-0.5 text-[0.7rem] leading-snug text-white/35">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
