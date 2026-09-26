import type { ReactNode } from "react";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Standard page chrome: ambient backdrop + sticky header + footer. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AmbientBackground />
      <SiteHeader />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}

/**
 * Page header block used by inner pages (templates, builder, dashboard).
 */
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        {eyebrow && (
          <span className="font-bangla text-xs font-bold uppercase tracking-[0.2em] text-[#FFC107]">
            {eyebrow}
          </span>
        )}
        <h1 className="font-bangla mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="font-bangla mt-3 text-base leading-relaxed text-white/55">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
