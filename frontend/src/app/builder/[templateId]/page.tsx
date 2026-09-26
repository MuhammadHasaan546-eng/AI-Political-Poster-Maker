"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ImagePlus,
  Loader2,
  Printer,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { BuilderForm } from "@/components/builder/BuilderForm";
import { PhotoUploader, type UploadedPhoto } from "@/components/builder/PhotoUploader";
import { LayerControls } from "@/components/builder/LayerControls";
import { PosterCanvas } from "@/components/poster/PosterCanvas";
import { GenerationProgress } from "@/components/poster/GenerationProgress";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { useToast } from "@/components/providers/ToastProvider";
import {
  apiAnalyzeLayout,
  apiGeneratePoster,
  apiGetPoster,
  apiGetTemplate,
  apiGetTemplates,
  apiRegeneratePoster,
  apiUploadImages,
} from "@/lib/api-client";
import { downloadPosterPng, printPosterAsPdf } from "@/lib/canvas";
import { getTemplateById, MOCK_TEMPLATES } from "@/lib/mock-data";
import {
  DEFAULT_LAYER_SETTINGS,
  OCCASION_LABELS,
  type LayerSettings,
  type Poster,
  type PosterFormData,
  type PosterStatus,
  type Template,
} from "@/lib/types";
import { cn, formatDate, toSameOriginAssetUrl } from "@/lib/utils";
import type { PosterFormValues } from "@/lib/validations";

const MAX_REGENERATIONS = 3;
/** Poll cadence + ceiling while the backend renders (Gemini + Chrome). */
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 40;

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Baseline form state, refined once the template is loaded. */
function emptyForm(): PosterFormValues {
  return {
    occasionType: "general",
    headline: "",
    name: "",
    designation: "",
    organization: "",
    unionThanaJela: "",
    partyName: "",
    promoteBy: "",
  };
}

export default function BuilderPage() {
  const params = useParams<{ templateId: string }>();
  const templateId = typeof params.templateId === "string" ? params.templateId : "";

  /* All hooks run unconditionally so hook order stays stable. */
  const [template, setTemplate] = useState<Template | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [formData, setFormData] = useState<PosterFormValues>(() => emptyForm());
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [settings, setSettings] = useState<LayerSettings>(DEFAULT_LAYER_SETTINGS);
  const [status, setStatus] = useState<PosterStatus>("draft");
  const [poster, setPoster] = useState<Poster | null>(null);
  const [regenerations, setRegenerations] = useState(0);
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const initializedFor = useRef<string | null>(null);
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  /* Load the template from the backend (so its id is a real ObjectId the
     generation endpoint accepts), falling back to the bundled mocks.

     Marketing surfaces render `MOCK_TEMPLATES` for their previews and therefore
     link to mock ids like `tpl-victory-classic`. Those are NOT valid Mongo
     ObjectIds, so we resolve them to the matching live template (by occasion
     type) from the library; otherwise `POST /api/posters` rejects the id. */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // Happy path: the id is a live ObjectId.
        const remote = await apiGetTemplate(templateId);
        if (!cancelled) setTemplate(remote);
      } catch {
        // Not a live id (e.g. a mock id) — resolve it to a live template.
        const mock = getTemplateById(templateId);

        if (!mock) {
          if (!cancelled) setTemplate(null);
        } else {
          try {
            const list = await apiGetTemplates();
            const match =
              list.find(
                (item) => item.isActive && item.occasionType === mock.occasionType,
              ) ?? list.find((item) => item.isActive);
            if (!cancelled) setTemplate(match ?? mock);
          } catch {
            // Backend unreachable — keep the mock so the preview still renders.
            if (!cancelled) setTemplate(mock);
          }
        }
      } finally {
        // ALWAYS clear the skeleton, whichever branch resolved.
        if (!cancelled) setTemplateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  /* Seed the form from the template once (native occasion + a sensible headline). */
  useEffect(() => {
    if (!template || initializedFor.current === template.id) return;
    initializedFor.current = template.id;
    setFormData((current) => ({
      ...current,
      occasionType: template.occasionType,
      headline: current.headline || template.title.split("—")[0].trim(),
    }));
  }, [template]);

  /** Photo sources handed to the canvas (remote URL once uploaded, else local). */
  const photoSources = useMemo<(string | null)[]>(
    () => photos.map((photo) => photo.remoteUrl ?? photo.previewUrl),
    [photos],
  );

  const renderInput = useMemo(
    () => ({
      // Fall back to a bundled layout until the real template resolves; the
      // memo runs before the loading/not-found early returns.
      layout: template?.layoutConfig ?? MOCK_TEMPLATES[0].layoutConfig,
      formData: formData as PosterFormData,
      photos: photoSources,
      settings,
    }),
    [template, formData, photoSources, settings],
  );

  /** Batch upload every selected file in one multipart request. */
  const uploadFiles = useCallback(async (files: File[]) => {
    const results = await apiUploadImages(files);
    return results.map((result) => result.url);
  }, []);

  /** Poll a poster id until the backend job settles (completed/failed). */
  const pollUntilSettled = useCallback(async (id: string): Promise<Poster> => {
    let current = await apiGetPoster(id);
    setPoster(current);

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      if (current.status === "completed" || current.status === "failed") break;
      await sleep(POLL_INTERVAL_MS);
      current = await apiGetPoster(id);
      setPoster(current);
    }
    return current;
  }, []);

  const runGeneration = useCallback(
    async (values: PosterFormValues) => {
      if (!template) return;
      setBusy(true);
      setStatus("generating");
      setPoster(null);

      try {
        const created = await apiGeneratePoster({
          templateId: template.id,
          formData: values as PosterFormData,
          uploadedPhotoUrls: photos.map((photo) => photo.remoteUrl ?? photo.previewUrl),
        });

        const settled = await pollUntilSettled(created.id);

        if (settled.status === "completed") {
          setStatus("completed");
          setRegenerations((count) => count + 1);
          toastSuccess("AI poster created successfully. You can download it now.");
        } else {
          setStatus("failed");
          toastError(settled.errorMessage || "Could not create the poster. Please try again.");
        }
      } catch (error) {
        setStatus("failed");
        toastError(error instanceof Error ? error.message : "Something went wrong.");
      } finally {
        setBusy(false);
      }
    },
    [template, photos, pollUntilSettled, toastSuccess, toastError],
  );

  /** Re-roll the existing job, applying the current layer overrides. */
  const regenerate = useCallback(async () => {
    if (!poster) return;
    setBusy(true);
    setStatus("generating");
    try {
      const roll = await apiRegeneratePoster(poster.id, {
        fontFamily: settings.fontFamily,
        headlineColor: settings.headlineColor,
        showMotifs: settings.showMotifs,
        showFooterBar: settings.showFooterBar,
      });
      setPoster(roll);
      const settled = await pollUntilSettled(poster.id);
      if (settled.status === "completed") {
        setStatus("completed");
        setRegenerations((count) => count + 1);
        toastSuccess("Poster regenerated successfully.");
      } else {
        setStatus("failed");
        toastError(settled.errorMessage || "Could not regenerate the poster.");
      }
    } catch (error) {
      setStatus("failed");
      toastError(error instanceof Error ? error.message : "Regeneration failed.");
    } finally {
      setBusy(false);
    }
  }, [poster, settings, pollUntilSettled, toastSuccess, toastError]);

  const applyAiSuggestions = useCallback(async () => {
    setAnalyzing(true);
    try {
      const suggestion = await apiAnalyzeLayout({
        occasionType: formData.occasionType,
        headline: formData.headline,
        paletteHint: settings.headlineColor ? [settings.headlineColor] : undefined,
      });
      setSettings((current) => ({
        ...current,
        fontFamily: suggestion.headlineFontFamily,
        headlineColor: suggestion.palette[1] ?? "#FFC107",
      }));
      toastSuccess(suggestion.rationale);
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Could not fetch AI suggestions.");
    } finally {
      setAnalyzing(false);
    }
  }, [formData.occasionType, formData.headline, settings.headlineColor, toastSuccess, toastError]);

  /** Download the backend-rendered PNG (falls back to the client render). */
  const handleDownload = useCallback(async () => {
    const remoteUrl = toSameOriginAssetUrl(poster?.generatedImageUrl);
    try {
      if (remoteUrl) {
        const anchor = document.createElement("a");
        anchor.href = remoteUrl;
        anchor.download = `sonar-bangla-${poster?.id ?? templateId}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } else {
        await downloadPosterPng(renderInput, `sonar-bangla-${templateId}-${Date.now()}.png`);
      }
      toastSuccess("Download started.");
    } catch {
      toastError("Could not generate the PNG.");
    }
  }, [poster, renderInput, templateId, toastSuccess, toastError]);

  /** Print/save the backend PDF when available, else the client render. */
  const handlePrint = useCallback(async () => {
    const pdfUrl = toSameOriginAssetUrl(poster?.pdfUrl);
    try {
      if (pdfUrl) {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
        toastInfo("PDF opened in a new tab.");
        return;
      }
      await printPosterAsPdf(renderInput);
      toastInfo("Save as PDF from the print dialog.");
    } catch {
      toastError("Could not generate the PDF.");
    }
  }, [poster, renderInput, toastInfo, toastError]);

  if (templateLoading) {
    return (
      <PageShell>
        <div className="mx-auto grid max-w-[1360px] place-items-center px-5 py-24">
          <Loader2 className="size-7 animate-spin text-[#FFC107]" />
          <p className="mt-4 text-sm text-white/50">Loading template…</p>
        </div>
      </PageShell>
    );
  }

  if (!template) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-5 py-24 text-center">
          <h1 className="text-2xl font-extrabold text-white">
            Template not found
          </h1>
          <p className="mt-3 text-sm text-white/55">
            The requested template does not exist or has been removed.
          </p>
          <Link
            href="/templates"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gold-gradient px-5 py-3 text-sm font-bold text-[#0D1117]"
          >
            <ArrowLeft className="size-4" /> Back to Template Library
          </Link>
        </div>
      </PageShell>
    );
  }

  const regenerationsLeft = Math.max(0, MAX_REGENERATIONS - regenerations);
  const canRegenerate = status !== "generating" && !busy && regenerationsLeft > 0;
  const generatedUrl = toSameOriginAssetUrl(poster?.generatedImageUrl);
  const showGenerated = status === "completed" && Boolean(generatedUrl);

  return (
    <PageShell>
      <div className="mx-auto max-w-[1360px] px-5 py-8 sm:px-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-5 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/40 transition-colors hover:text-[#FFC107]"
            >
              <ArrowLeft className="size-3.5" /> Change Template
            </Link>
            <h1 className="font-bangla mt-2 flex flex-wrap items-center gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {template.title}
              <Badge tone="emerald">{OCCASION_LABELS[template.occasionType]}</Badge>
            </h1>
            <p className="mt-1.5 text-sm text-white/50">
              Fill in the details — the poster preview updates live on the right.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[0.7rem] font-semibold text-white/50 sm:inline-flex">
              Regenerations {regenerations}/{MAX_REGENERATIONS}
            </span>
            <Button
              variant="outline"
              size="sm"
              loading={analyzing}
              onClick={applyAiSuggestions}
              leftIcon={<Wand2 className="size-4" />}
            >
              <span>AI Suggestions</span>
            </Button>
          </div>
        </div>

        {/* Split view */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          {/* -------------------------- Left: data entry -------------------------- */}
          <div className="space-y-6">
            <section className="glass-card rounded-3xl p-5 sm:p-6">
              <BuilderForm
                values={formData}
                formKey={templateId}
                onChange={setFormData}
                onGenerate={runGeneration}
              />
            </section>

            <section className="glass-card space-y-4 rounded-3xl p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/50">
                <ImagePlus className="size-4 text-[#FFC107]" /> Photos (up to 3)
              </h2>
              <PhotoUploader
                photos={photos}
                onChange={setPhotos}
                maxFiles={3}
                maxMb={8}
                uploadFiles={uploadFiles}
              />
            </section>

            <div className="sticky bottom-4 z-20">
              <Button
                variant="gold"
                size="lg"
                fullWidth
                loading={busy}
                disabled={busy}
                onClick={() => void runGeneration(formData)}
                leftIcon={busy ? undefined : <Sparkles className="size-5" />}
              >
                <span>
                  {status === "generating"
                    ? "AI is creating your poster…"
                    : regenerations === 0
                      ? "Create Poster with AI"
                      : "Regenerate"}
                </span>
              </Button>
            </div>
          </div>

          {/* --------------------------- Right: preview --------------------------- */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {showGenerated ? (
              <div className="glass-card overflow-hidden rounded-3xl p-2">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#0D1117]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generatedUrl ?? ""}
                    alt="AI generated poster"
                    className="size-full object-contain"
                  />
                </div>
                {poster?.creativeBrief?.generatedBy && (
                  <p className="px-3 py-2 text-[0.7rem] text-white/45">
                    AI art direction: {poster.creativeBrief.generatedBy === "gemini" ? "Gemini" : "Heuristic"}
                  </p>
                )}
              </div>
            ) : (
              <PosterCanvas
                layout={template.layoutConfig}
                formData={formData as PosterFormData}
                photos={photoSources}
                settings={settings}
              />
            )}

            {status === "generating" || status === "completed" || status === "failed" ? (
              <GenerationProgress status={status} />
            ) : (
              <div className="glass-card rounded-2xl p-5">
                <p className="text-sm font-semibold text-white">
                  Live preview ready
                </p>
                <p className="mt-1 text-xs text-white/50">
                  This preview updates as you fill in the details on the left. When
                  you are happy, press “Create Poster with AI”.
                </p>
              </div>
            )}

            {status === "failed" && poster?.errorMessage && (
              <div className="glass-card flex items-start gap-2 rounded-2xl border-red-500/25 p-4">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#F42A41]" />
                <p className="font-bangla text-xs text-white/60">{poster.errorMessage}</p>
              </div>
            )}

            {/* Export toolbar */}
            <div className="glass-card rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void handleDownload()}
                  leftIcon={<Download className="size-4" />}
                >
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handlePrint()}
                  leftIcon={<Printer className="size-4" />}
                >
                  PDF / Print
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  disabled={!poster || !canRegenerate}
                  onClick={() => void regenerate()}
                  leftIcon={
                    busy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )
                  }
                >
                  <span>Regenerate ({regenerationsLeft})</span>
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.7rem] text-white/40">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  {template.layoutConfig.canvas.w} × {template.layoutConfig.canvas.h} px
                </span>
                {poster && (
                  <span className="tabular-nums">
                    Last created: {formatDate(poster.createdAt)}
                  </span>
                )}
                <span>
                  Photos {photos.length}/3 • Font {settings.fontFamily}
                </span>
              </div>
            </div>

            {/* Layer tuning */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("glass-card rounded-2xl p-5")}
            >
              <LayerControls settings={settings} onChange={setSettings} />
            </motion.section>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
