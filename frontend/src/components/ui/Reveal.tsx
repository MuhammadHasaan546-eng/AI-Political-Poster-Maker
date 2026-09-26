"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 36, y: 0 },
  right: { x: -36, y: 0 },
  none: { x: 0, y: 0 },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds of delay before the reveal begins. */
  delay?: number;
  direction?: Direction;
  duration?: number;
  /** Replay the animation every time the element enters the viewport. */
  once?: boolean;
};

/**
 * Scroll-triggered reveal: fade + slide, matching the hero entrance easing.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.8,
  once = true,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const { x, y } = offsets[direction];

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.2, margin: "0px 0px -60px 0px" }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
