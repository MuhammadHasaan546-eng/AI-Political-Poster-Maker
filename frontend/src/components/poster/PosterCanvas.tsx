"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { preloadPhotos, renderPoster, type RenderInput } from "@/lib/canvas";
import type { LayerSettings, LayoutConfig, PosterFormData } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface PosterCanvasProps {
  layout: LayoutConfig;
  formData: PosterFormData;
  photos?: (string | null)[];
  settings?: LayerSettings;
  className?: string;
  /** Receives the freshly painted canvas (used by the export toolbar). */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

/**
 * Live HTML5 Canvas preview.
 *
 * Text is painted as real font glyphs rather than an image overlay, so Bangla
 * conjuncts stay correctly shaped at every size.
 */
export function PosterCanvas({
  layout,
  formData,
  photos,
  settings,
  className,
  onCanvasReady,
}: PosterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [painting, setPainting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { w, h } = layout.canvas;
    canvas.width = w;
    canvas.height = h;

    const input: RenderInput = { layout, formData, photos, settings };

    const paint = async () => {
      setPainting(true);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Ensure photos + Bangla fonts are ready before the first stroke.
      await preloadPhotos(photos ?? []);
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Font loading API unavailable — continue with fallbacks.
        }
      }
      if (cancelled) return;
      await renderPoster(ctx, input);
      if (cancelled) return;
      setPainting(false);
      onCanvasReady?.(canvas);
    };

    void paint();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, formData, photos, settings]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0D1117] shadow-2xl shadow-black/50",
        className,
      )}
      style={{ aspectRatio: `${layout.canvas.w} / ${layout.canvas.h}` }}
    >
      <canvas
        ref={canvasRef}
        aria-label="Poster preview"
        className="block h-full w-full"
      />
      {painting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 grid place-items-center bg-[#0D1117]/60 backdrop-blur-[2px]"
        >
          <div className="flex flex-col items-center gap-2 text-white/70">
            <Loader2 className="size-6 animate-spin text-[#FFC107]" />
            <span className="text-xs">Rendering…</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Small static poster preview used inside template cards.
 * Renders at low resolution once fonts are ready.
 */
export function PosterThumbnail({
  layout,
  formData,
  className,
}: {
  layout: LayoutConfig;
  formData: PosterFormData;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { w, h } = layout.canvas;
    canvas.width = w;
    canvas.height = h;

    const paint = async () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Ignore; fall back to system fonts.
        }
      }
      if (cancelled) return;
      await renderPoster(ctx, { layout, formData });
    };

    void paint();
    return () => {
      cancelled = true;
    };
  }, [layout, formData]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("block h-full w-full", className)}
    />
  );
}
