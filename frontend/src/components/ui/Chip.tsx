"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export interface ChipProps extends HTMLMotionProps<"button"> {
  active?: boolean;
  count?: number;
  children?: ReactNode;
}

/**
 * Filter pill used by the template category bar and builder occasion picker.
 * Renders as a toggle button (`aria-pressed`) so it is screen-reader friendly.
 */
export function Chip({
  active = false,
  count,
  className,
  children,
  type = "button",
  ...rest
}: ChipProps) {
  return (
    <motion.button
      type={type}
      aria-pressed={active}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
        "transition-all duration-250 focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#FFC107]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]",
        active
          ? "border-[#FFC107]/60 bg-gold-gradient text-[#0D1117] shadow-lg shadow-[#FFC107]/25"
          : "glass-chip text-white/70 hover:border-white/25 hover:text-white",
        className,
      )}
      {...rest}
    >
      {children}
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums",
            active ? "bg-[#0D1117]/20 text-[#0D1117]" : "bg-white/10 text-white/60",
          )}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}

export type BadgeTone = "gold" | "emerald" | "red" | "neutral";

const BADGE_TONES: Record<BadgeTone, string> = {
  gold: "bg-[#FFC107]/15 text-[#FFC107] border-[#FFC107]/30",
  emerald: "bg-[#006A4E]/25 text-emerald-300 border-emerald-400/30",
  red: "bg-[#F42A41]/15 text-red-300 border-red-400/30",
  neutral: "bg-white/[0.06] text-white/60 border-white/10",
};

/** Small non-interactive status label. */
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
