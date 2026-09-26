import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover lift + border highlight (used by template/poster cards). */
  interactive?: boolean;
  /** Renders the emerald/gold gradient hairline along the top edge. */
  accent?: boolean;
  children?: ReactNode;
}

export function Card({
  interactive = false,
  accent = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "glass-card relative overflow-hidden rounded-3xl",
        accent &&
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#FFC107]/70 before:to-transparent",
        interactive &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-[#FFC107]/35 hover:shadow-2xl hover:shadow-[#006A4E]/30",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        <h3 className="text-base font-bold tracking-tight text-white">{title}</h3>
        {description && (
          <p className="text-sm leading-relaxed text-white/55">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("p-5 sm:p-6", className)}>{children}</div>;
}
