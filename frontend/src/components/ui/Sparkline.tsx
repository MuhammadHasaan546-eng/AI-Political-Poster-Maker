"use client";

import { motion } from "motion/react";
import { useId } from "react";

type SparklineProps = {
  /** Normalised series values (any range). */
  data?: number[];
  className?: string;
  stroke?: string;
  fill?: string;
};

const WIDTH = 160;
const HEIGHT = 56;
const PADDING = 6;

function buildPath(data: number[]) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = (WIDTH - PADDING * 2) / (data.length - 1);

  return data.map((value, index) => {
    const x = PADDING + index * stepX;
    const y =
      HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2);
    return { x, y };
  });
}

/** Smooth (Catmull-Rom style) line through the points for a polished curve. */
function toSmoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    d += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
}

/**
 * Interactive mini sparkline that draws itself in and animates on loop.
 */
export function Sparkline({
  data = [12, 18, 14, 24, 20, 32, 28, 40],
  className = "",
  stroke = "#7C3AED",
  fill = "#7C3AED",
}: SparklineProps) {
  const gradientId = useId();
  const points = buildPath(data);
  const line = toSmoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${HEIGHT} L ${points[0].x} ${HEIGHT} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Upward trending sparkline"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.35" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.path
        d={area}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.4 }}
      />

      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />

      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3.5}
        fill={stroke}
        stroke="#fff"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 1.3 }}
      />
    </svg>
  );
}
