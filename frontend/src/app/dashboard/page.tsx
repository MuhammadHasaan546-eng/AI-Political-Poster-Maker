"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Copy,
  Download,
  Image as ImageIcon,
  LayoutTemplate,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCircle2,
  Zap,
} from "lucide-react";
import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { PosterThumbnail } from "@/components/poster/PosterCanvas";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { PosterSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  apiDeletePoster,
  apiGeneratePoster,
  apiGetTemplates,
  apiListPosters,
} from "@/lib/api-client";
import { downloadPosterPng, type RenderInput } from "@/lib/canvas";
import { getTemplateById } from "@/lib/mock-data";
import type { Poster, PosterStatus, Template } from "@/lib/types";
import { cn, formatDate, toSameOriginAssetUrl } from "@/lib/utils";

const TOTAL_TOKENS = 50;

const STATUS_LABELS: Record<PosterStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_TONES: Record<PosterStatus, "gold" | "emerald" | "red" | "neutral"> = {
  draft: "neutral",
  generating: "gold",
  completed: "emerald",
  failed: "red",
};

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 text-white/50">
        <span className="grid size-8 place-items-center rounded-xl bg-white/[0.05] text-[#FFC107]">
          {icon}
        </span>
        <span className="font-bangla text-[0.72rem] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-3 font-bangla text-2xl font-extrabold tracking-tight text-white tabular-nums">
        {value}
      </p>
      {hint && <p className="font-bangla mt-0.5 text-[0.7rem] text-white/40">{hint}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, ready, logout } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [posters, setPosters] = useState<Poster[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Poster | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const list = await apiListPosters();
      setPosters(list);
    } catch {
      toastError("Could not load the poster list.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /* Load the live template library so poster thumbnails resolve by id and the
     client-side fallback render still works offline. */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await apiGetTemplates();
        if (!cancelled) setTemplates(list);
      } catch {
        // Leave empty — `getTemplateById` still covers bundled templates.
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

  const resolveTemplate = useCallback(
    (id: string): Template | undefined => templateMap[id] ?? getTemplateById(id),
    [templateMap],
  );

  const stats = useMemo(() => {
    const completed = posters.filter((poster) => poster.status === "completed").length;
    const active = posters.filter((poster) => poster.status === "generating").length;
    return {
      total: posters.length,
      completed,
      active,
      tokensLeft: Math.max(0, TOTAL_TOKENS - posters.length),
    };
  }, [posters]);

  const handleDelete = useCallback(async () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;
    setPendingId(id);
    try {
      await apiDeletePoster(id);
      setPosters((current) => current.filter((poster) => poster.id !== id));
      toastSuccess("Poster deleted.");
      setConfirmTarget(null);
    } catch {
      toastError("Could not delete the poster.");
    } finally {
      setPendingId(null);
    }
  }, [confirmTarget, toastSuccess, toastError]);

  const handleDuplicate = useCallback(
    async (poster: Poster) => {
      setBusyId(poster.id);
      try {
        await apiGeneratePoster({
          templateId: poster.templateId,
          formData: poster.formData,
          uploadedPhotoUrls: poster.uploadedPhotoUrls,
        });
        toastInfo("Creating a new copy…");
        window.setTimeout(() => void refresh(), 2800);
      } catch {
        toastError("Could not create the copy.");
      } finally {
        setBusyId(null);
      }
    },
    [refresh, toastInfo, toastError],
  );

  const handleDownload = useCallback(
    async (poster: Poster) => {
      // Prefer the server-rendered PNG; it is the authoritative artifact.
      const remoteUrl = toSameOriginAssetUrl(poster.generatedImageUrl);
      if (remoteUrl) {
        const anchor = document.createElement("a");
        anchor.href = remoteUrl;
        anchor.download = `sonar-bangla-${poster.id}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        toastSuccess("Download started.");
        return;
      }

      const template = resolveTemplate(poster.templateId);
      if (!template) {
        toastError("The template no longer exists.");
        return;
      }
      const input: RenderInput = {
        layout: template.layoutConfig,
        formData: poster.formData,
        photos: poster.uploadedPhotoUrls,
      };
      try {
        await downloadPosterPng(input, `sonar-bangla-${poster.id}.png`);
        toastSuccess("Download started.");
      } catch {
        toastError("Download failed.");
      }
    },
    [resolveTemplate, toastSuccess, toastError],
  );

  /* --------------------------- Unauthenticated --------------------------- */
  if (ready && !user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-5 py-24 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/[0.05] text-[#FFC107]">
            <UserCircle2 className="size-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-white">
            Log in to view your dashboard
          </h1>
          <p className="mt-3 text-sm text-white/55">
            Sign in to your account to save and re-download all your posters.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button variant="gold" size="lg" leftIcon={<ShieldCheck className="size-5" />}>
                Log In
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" size="lg">
                View Templates
              </Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const tokenPercent = Math.round((stats.tokensLeft / TOTAL_TOKENS) * 100);

  return (
    <PageShell>
      <div className="mx-auto max-w-[1360px] space-y-8 px-5 py-10 sm:px-8 lg:py-14">
        <PageHeading
          eyebrow="Dashboard"
          title={`Welcome, ${user?.name ?? "User"}`}
          description="View your profile, token balance, and all the posters you have created."
          action={
            <div className="flex items-center gap-2">
              {user?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" leftIcon={<ShieldCheck className="size-4" />}>
                    <span>Admin</span>
                  </Button>
                </Link>
              )}
              <Link href="/templates">
                <Button variant="gold" leftIcon={<Plus className="size-4" />}>
                  <span>New Poster</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Log out"
                onClick={() => {
                  void logout();
                  toastInfo("Logged out.");
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          }
        />

        {/* Profile + tokens */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="glass-card flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:p-6">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-emerald-gradient text-2xl font-extrabold text-white shadow-lg shadow-[#006A4E]/40">
              {(user?.name ?? "U").trim().charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-white">
                  {user?.name ?? "Demo User"}
                </h2>
                <Badge tone={user?.role === "admin" ? "gold" : "emerald"}>
                  {user?.role === "admin" ? "Admin" : "Member"}
                </Badge>
              </div>
              <p className="mt-1 truncate text-sm text-white/50">
                {user?.emailOrPhone ?? "demo@sonarbangla.ai"}
              </p>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap className="size-4 text-[#FFC107]" /> Token Balance
              </span>
              <span className="font-bangla text-sm font-bold text-[#FFC107] tabular-nums">
                {stats.tokensLeft}/{TOTAL_TOKENS}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tokenPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#0A8A67] to-[#FFC107]"
              />
            </div>
            <p className="mt-3 text-xs text-white/45">
              Each poster costs 1 token. The free plan includes {TOTAL_TOKENS} tokens per month.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            icon={<ImageIcon className="size-4" />}
            label="Total Posters"
            value={stats.total}
          />
          <StatTile
            icon={<ShieldCheck className="size-4" />}
            label="Completed"
            value={stats.completed}
          />
          <StatTile
            icon={<RefreshCw className="size-4" />}
            label="In Progress"
            value={stats.active}
            hint="Processing"
          />
          <StatTile
            icon={<Zap className="size-4" />}
            label="Tokens Left"
            value={stats.tokensLeft}
          />
        </div>

        {/* History */}
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/50">
              <LayoutTemplate className="size-4 text-[#FFC107]" /> Poster History
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refresh()}
              leftIcon={<RefreshCw className={cn("size-4", loading && "animate-spin")} />}
            >
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <PosterSkeleton key={index} />
              ))}
            </div>
          ) : posters.length === 0 ? (
            <div className="glass-card grid place-items-center rounded-3xl px-6 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-white/[0.04]">
                <ImageIcon className="size-6 text-[#FFC107]" />
              </span>
              <p className="mt-4 text-sm font-bold text-white">
                No posters created yet
              </p>
              <p className="mt-1 text-xs text-white/45">
                Pick a template to create your first poster.
              </p>
              <Link href="/templates" className="mt-6">
                <Button variant="gold" leftIcon={<Plus className="size-4" />}>
                  <span>Create Poster</span>
                </Button>
              </Link>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4"
            >
              <AnimatePresence initial={false}>
                {posters.map((poster) => {
                  const template = resolveTemplate(poster.templateId);
                  const generated = toSameOriginAssetUrl(poster.generatedImageUrl);
                  const busy = busyId === poster.id;
                  return (
                    <motion.article
                      key={poster.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      className="group glass-card relative overflow-hidden rounded-3xl"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#0D1117]">
                        {generated ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={generated}
                            alt={poster.formData.headline}
                            className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : template ? (
                          <PosterThumbnail
                            layout={template.layoutConfig}
                            formData={poster.formData}
                            className="transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <span className="grid size-full place-items-center text-white/25">
                            <ImageIcon className="size-8" />
                          </span>
                        )}

                        <span className="absolute left-3 top-3">
                          <Badge tone={STATUS_TONES[poster.status]}>
                            {STATUS_LABELS[poster.status]}
                          </Badge>
                        </span>

                        {poster.status === "generating" && (
                          <span className="absolute inset-0 grid place-items-center bg-[#0D1117]/55 backdrop-blur-[1px]">
                            <RefreshCw className="size-6 animate-spin text-[#FFC107]" />
                          </span>
                        )}

                        <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-end gap-1.5 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/85 to-transparent p-3 pt-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <Button
                            variant="subtle"
                            size="icon"
                            aria-label="Download again"
                            disabled={poster.status !== "completed"}
                            onClick={() => void handleDownload(poster)}
                          >
                            <Download className="size-4" />
                          </Button>
                          <Button
                            variant="subtle"
                            size="icon"
                            aria-label="Create copy"
                            loading={busy}
                            onClick={() => void handleDuplicate(poster)}
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            variant="subtle"
                            size="icon"
                            aria-label="Delete"
                            onClick={() => setConfirmTarget(poster)}
                          >
                            <Trash2 className="size-4 text-[#F42A41]" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5 p-4">
                        <h3 className="font-bangla line-clamp-2 text-sm font-bold leading-snug text-white">
                          {poster.formData.headline}
                        </h3>
                        <p className="truncate text-[0.7rem] text-white/45">
                          {poster.formData.name || "No name"}
                        </p>
                        <p className="text-[0.65rem] uppercase tracking-wider text-white/30 tabular-nums">
                          {formatDate(poster.createdAt)}
                        </p>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </div>

      <Modal
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        title="Delete this poster?"
        description="This action cannot be undone. The poster will be permanently deleted."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={pendingId === confirmTarget?.id}
              onClick={() => void handleDelete()}
              leftIcon={<Trash2 className="size-4" />}
            >
              Delete
            </Button>
          </div>
        }
      >
        {confirmTarget && (
          <p className="font-bangla text-sm text-white/60">{confirmTarget.formData.headline}</p>
        )}
      </Modal>
    </PageShell>
  );
}
