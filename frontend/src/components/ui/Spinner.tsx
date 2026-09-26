import { cn } from "@/lib/utils";

export interface SpinnerProps {
  className?: string;
  label?: string;
}

/** Accessible indeterminate loading indicator. */
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <svg
      role="status"
      aria-label={label}
      viewBox="0 0 24 24"
      className={cn("size-5 animate-spin text-current", className)}
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Three-dot pulse used inside compact buttons/badges. */
export function DotsLoader({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center gap-1", className)}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 animate-bounce rounded-full bg-current"
          style={{ animationDelay: `${index * 0.12}s` }}
        />
      ))}
    </span>
  );
}
