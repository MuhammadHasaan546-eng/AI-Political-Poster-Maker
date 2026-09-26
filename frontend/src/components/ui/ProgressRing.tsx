import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  /** 0 – 100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

/** Circular determinate progress indicator (emerald → gold gradient stroke). */
export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 5,
  className,
  label,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);
  const gradientId = `ring-grad-${size}-${strokeWidth}`;
  const finalLabel = label ?? `${Math.round(clamped)}%`;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={finalLabel}
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0A8A67" />
            <stop offset="100%" stopColor="#FFC107" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 450ms ease" }}
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums text-white">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

/** Linear determinate bar used by exports and upload progress. */
export function ProgressBar({
  value,
  className,
  showLabel = false,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0A8A67] to-[#FFC107] transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-white/70">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
