"use client";

import { Chip } from "@/components/ui/Chip";
import { OCCASION_LABELS, type OccasionFilter, type Template } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CategoryChipsProps {
  templates: Template[];
  value: OccasionFilter;
  onChange: (next: OccasionFilter) => void;
  className?: string;
}

/**
 * Horizontal category filter with per-category counts.
 * Scrolls on mobile and wraps on larger screens.
 */
export function CategoryChips({
  templates,
  value,
  onChange,
  className,
}: CategoryChipsProps) {
  const counts = templates.reduce<Record<string, number>>((acc, template) => {
    acc[template.occasionType] = (acc[template.occasionType] ?? 0) + 1;
    return acc;
  }, {});

  const order: OccasionFilter[] = [
    "all",
    "victory-day",
    "independence-day",
    "election-campaign",
    "political-rally",
    "condolence",
    "eid",
    "ramadan",
    "congratulation",
    "birthday",
    "general",
  ];

  const visible = order.filter(
    (occasion) => occasion === "all" || (counts[occasion] ?? 0) > 0,
  );

  return (
    <div
      role="group"
      aria-label="Template categories"
      className={cn(
        "-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
        "scrollbar-none",
        className,
      )}
    >
      {visible.map((occasion) => (
        <Chip
          key={occasion}
          active={value === occasion}
          count={
            occasion === "all" ? templates.length : (counts[occasion] ?? 0)
          }
          onClick={() => onChange(occasion)}
        >
          <span>
            {occasion === "all" ? "All Templates" : OCCASION_LABELS[occasion]}
          </span>
        </Chip>
      ))}
    </div>
  );
}
