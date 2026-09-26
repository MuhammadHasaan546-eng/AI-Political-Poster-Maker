"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { PosterThumbnail } from "@/components/poster/PosterCanvas";
import { Button } from "@/components/ui/Button";
import { Badge, Chip, type BadgeTone } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/ToastProvider";
import { apiAdminListPosters, apiGetTemplates } from "@/lib/api-client";
import type { Poster, PosterStatus, Template } from "@/lib/types";
import { formatDate, toSameOriginAssetUrl } from "@/lib/utils";

const STATUS_LABELS: Record<PosterStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_TONES: Record<PosterStatus, BadgeTone> = {
  draft: "neutral",
  generating: "gold",
  completed: "emerald",
  failed: "red",
};

const FILTERS: Array<{ value: PosterStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "generating", label: "In Progress" },
  { value: "failed", label: "Failed" },
];

export default function AdminPostersPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [status, setStatus] = useState<PosterStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Poster | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(
    async (next: PosterStatus | "all") => {
      setLoading(true);
      try {
        const list = await apiAdminListPosters({
          status: next === "all" ? undefined : next,
          limit: 120,
        });
        setPosters(list);
      } catch {
        toastError("Could not load the poster list.");
      } finally {
        setLoading(false);
      }
    },
    [toastError],
  );

  useEffect(() => {
    void refresh(status);
  }, [status, refresh]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await apiGetTemplates();
        if (!cancelled) setTemplates(list);
      } catch {
        // Thumbnail fallback simply stays empty.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const templateMap = useMemo(() => {
    const map: Record<string, Template> = {};
    for (const template of templates) map[template.id] = template;
    return map;
  }, [templates]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/posters/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || body.success === false) {
        throw new Error(body.error ?? "Could not delete the poster.");
      }
      setPosters((current) => current.filter((poster) => poster.id !== deleteTarget.id));
      toastSuccess("Poster deleted.");
      setDeleteTarget(null);
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Could not delete the poster.");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, toastSuccess, toastError]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">
          Poster Moderation ({posters.length})
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refresh(status)}
          leftIcon={<RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />}
        >
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Chip
            key={filter.value}
            active={status === filter.value}
            onClick={() => setStatus(filter.value)}
          >
            <span>{filter.label}</span>
          </Chip>
        ))}
      </div>

      {loading && posters.length === 0 ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="size-7 animate-spin text-[#FFC107]" />
        </div>
      ) : posters.length === 0 ? (
        <div className="glass-card grid place-items-center rounded-3xl px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/[0.04]">
            <ImageIcon className="size-6 text-[#FFC107]" />
          </span>
          <p className="mt-4 text-sm text-white/50">No posters found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {posters.map((poster) => {
            const template = templateMap[poster.templateId];
            const generated = toSameOriginAssetUrl(poster.generatedImageUrl);
            return (
              <article key={poster.id} className="glass-card overflow-hidden rounded-2xl">
                <div className="relative aspect-[3/4] bg-[#0D1117]">
                  {generated ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={generated}
                      alt={poster.formData.headline}
                      className="size-full object-cover object-top"
                    />
                  ) : template ? (
                    <PosterThumbnail layout={template.layoutConfig} formData={poster.formData} />
                  ) : (
                    <span className="grid size-full place-items-center text-white/25">
                      <ImageIcon className="size-8" />
                    </span>
                  )}
                  <span className="absolute left-2 top-2">
                    <Badge tone={STATUS_TONES[poster.status]}>
                      {STATUS_LABELS[poster.status]}
                    </Badge>
                  </span>
                </div>
                <div className="space-y-1.5 p-3">
                  <h3 className="font-bangla line-clamp-2 text-sm font-bold text-white">
                    {poster.formData.headline}
                  </h3>
                  <p className="font-bangla truncate text-[0.68rem] text-white/45">
                    {poster.formData.name || "No name"}
                  </p>
                  <p className="text-[0.62rem] uppercase tracking-wider text-white/30 tabular-nums">
                    {formatDate(poster.createdAt)}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      variant="subtle"
                      size="icon"
                      aria-label="Download"
                      disabled={!generated}
                      onClick={() => {
                        if (!generated) return;
                        window.open(generated, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <Download className="size-3.5" />
                    </Button>
                    <Button
                      variant="subtle"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDeleteTarget(poster)}
                      leftIcon={<Trash2 className="size-3.5 text-[#F42A41]" />}
                    >
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this poster?"
        description="This action cannot be undone. The poster and its assets will be permanently deleted."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={() => void handleDelete()}
              leftIcon={<Trash2 className="size-4" />}
            >
              Delete
            </Button>
          </div>
        }
      >
        {deleteTarget && (
          <p className="font-bangla text-sm text-white/60">{deleteTarget.formData.headline}</p>
        )}
      </Modal>
    </div>
  );
}
