"use client";

import { motion } from "motion/react";
import { useId } from "react";

const WIDTH = 720;
const HEIGHT = 260;
const PAD_X = 8;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;

/** Sample usage series (kept deterministic for stable SSR output). */
const SERIES = [
  32, 41, 36, 52, 47, 63, 58, 74, 68, 86, 79, 96, 88, 104, 112,
];

const LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

function buildPoints() {
  const max = Math.max(...SERIES);
  const min = Math.min(...SERIES);
  const range = max - min || 1;
  const stepX = (WIDTH - PAD_X * 2) / (SERIES.length - 1);

  return SERIES.map((value, index) => ({
    x: PAD_X + index * stepX,
    y:
      HEIGHT -
      PAD_BOTTOM -
      ((value - min) / range) * (HEIGHT - PAD_TOP - PAD_BOTTOM),
  }));
}

function toSmoothPath(points: { x: number; y: number }[]) {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    d += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
}

export function NeonAreaChart({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const lineId = `neon-line-${uid}`;
  const areaId = `neon-area-${uid}`;
  const glowId = `neon-glow-${uid}`;

  const points = buildPoints();
  const line = toSmoothPath(points);
  const last = points[points.length - 1];
  const area = `${line} L ${last.x} ${HEIGHT - PAD_BOTTOM} L ${points[0].x} ${
    HEIGHT - PAD_BOTTOM
  } Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Active users trending upward over the last seven days"
    >
      <defs>
        <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="55%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
          <stop offset="45%" stopColor="#A855F7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
        </linearGradient>

        <filter id={glowId} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Horizontal grid lines */}
      {[0.2, 0.45, 0.7, 0.95].map((ratio) => (
        <line
          key={ratio}
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={HEIGHT * ratio}
          y2={HEIGHT * ratio}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={1}
        />
      ))}

      {/* Area fill */}
      <motion.path
        d={area}
        fill={`url(#${areaId})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      {/* Neon stroke, drawn on scroll */}
      <motion.path
        d={line}
        fill="none"
        stroke={`url(#${lineId})`}
        strokeWidth={3.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        filter={`url(#${glowId})`}
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{
          pathLength: { duration: 1.8, ease: "easeInOut" },
          opacity: { duration: 0.3 },
        }}
      />

      {/* Traveling highlight + endpoint */}
      <motion.circle
        cx={last.x}
        cy={last.y}
        r={5}
        fill="#EC4899"
        stroke="#fff"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, delay: 1.7 }}
      />

      {/* Day labels */}
      {LABELS.map((label, index) => (
        <text
          key={label}
          x={PAD_X + (index * (WIDTH - PAD_X * 2)) / (LABELS.length - 1)}
          y={HEIGHT - 6}
          textAnchor="middle"
          fontSize={12}
          fill="rgba(255,255,255,0.4)"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
