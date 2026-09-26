"use client";

import { useEffect, useState } from "react";
import { apiGetTemplates } from "./api-client";

/**
 * Resolve the "start building" destination to a *live* template.
 *
 * Hard-coding a template id is unsafe because templates are Mongo ObjectIds
 * created at seed time. This hook fetches the library once and returns a
 * `/builder/<objectId>` link for the first active template, falling back to the
 * live selector (`/templates`) while loading or when the library is empty.
 */
export function useBuilderHref(fallback = "/templates"): string {
  const [href, setHref] = useState<string>(fallback);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const templates = await apiGetTemplates();
        const first = templates.find((template) => template.isActive) ?? templates[0];
        if (!cancelled && first) setHref(`/builder/${first.id}`);
      } catch {
        // Backend unreachable — keep the selector fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return href;
}
