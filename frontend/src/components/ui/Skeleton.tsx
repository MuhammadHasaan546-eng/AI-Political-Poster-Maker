import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
}

/** Shimmer placeholder used while templates/posters load. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-white/[0.04] via-white/[0.09] to-white/[0.04]",
        className,
      )}
    />
  );
}

/** Aspect-correct poster placeholder (1200x1600 → 3:4). */
export function PosterSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
