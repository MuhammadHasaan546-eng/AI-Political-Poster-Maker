"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { CategoryChips } from "@/components/templates/CategoryChips";
import { TemplateCard, TemplateEmptyState } from "@/components/templates/TemplateCard";
import { PosterSkeleton } from "@/components/ui/Skeleton";
import { TextInput } from "@/components/ui/Input";
import { apiGetTemplates } from "@/lib/api-client";
import { MOCK_TEMPLATES } from "@/lib/mock-data";
import { OCCASION_TYPES, type OccasionFilter, type Template } from "@/lib/types";

function isOccasionFilter(value: string | null): value is OccasionFilter {
  if (!value) return false;
  return value === "all" || (OCCASION_TYPES as readonly string[]).includes(value);
}

function TemplatesContent() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("occasion");
  const [occasion, setOccasion] = useState<OccasionFilter>(
    isOccasionFilter(initial) ? initial : "all",
  );
  const [query, setQuery] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Load the live template library; fall back to the bundled mocks when the
  // backend is unreachable so the page stays usable offline.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiGetTemplates();
        if (!cancelled) setTemplates(list.filter((template) => template.isActive));
      } catch {
        if (!cancelled) setTemplates(MOCK_TEMPLATES.filter((template) => template.isActive));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const byOccasion =
      occasion === "all"
        ? templates
        : templates.filter((template) => template.occasionType === occasion);

    const term = query.trim().toLowerCase();
    if (!term) return byOccasion;
    return byOccasion.filter((template) => template.title.toLowerCase().includes(term));
  }, [templates, occasion, query]);

  return (
    <div className="mx-auto max-w-[1360px] space-y-8 px-5 py-10 sm:px-8 lg:py-14">
      <PageHeading
        eyebrow="Template Library"
        title="Choose a Template for Your Occasion"
        description="Every template is fully customizable — change photos, name, designation, and colors to create a poster instantly."
        action={
          <div className="w-full sm:w-72">
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates…"
              className="font-bangla"
              leftIcon={<Search className="size-4" />}
            />
          </div>
        }
      />

      <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
        <span className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/35 sm:flex">
          <SlidersHorizontal className="size-3.5" /> Filter
        </span>
        <CategoryChips
          templates={templates}
          value={occasion}
          onChange={setOccasion}
          className="flex-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => <PosterSkeleton key={index} />)
        ) : filtered.length === 0 ? (
          <TemplateEmptyState />
        ) : (
          filtered.map((template, index) => (
            <TemplateCard key={template.id} template={template} index={index} />
          ))
        )}
      </div>

      {!loading && (
        <p className="text-center text-xs text-white/35">
          Showing {filtered.length} templates
        </p>
      )}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="mx-auto max-w-[1360px] px-5 py-10 sm:px-8 lg:py-14">
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <PosterSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <PageShell>
      <Suspense fallback={<LoadingGrid />}>
        <TemplatesContent />
      </Suspense>
    </PageShell>
  );
}
