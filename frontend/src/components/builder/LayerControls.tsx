"use client";

import { Eye, EyeOff, Layers, Palette, Type } from "lucide-react";
import { BANGLA_FONTS, type LayerSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface LayerControlsProps {
  settings: LayerSettings;
  onChange: (next: LayerSettings) => void;
  className?: string;
}

const HEADLINE_SWATCHES = ["#FFFFFF", "#FFC107", "#F42A41", "#0D1117"];

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (next: number) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-xs font-semibold text-white/60">
        <span className="font-bangla">{label}</span>
        <span className="tabular-nums text-white/80">
          {value.toFixed(step < 1 ? 2 : 0)}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-[#FFC107]"
      />
    </label>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:border-white/20"
    >
      <span className="font-bangla text-xs font-semibold text-white/75">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
          enabled
            ? "bg-[#006A4E]/30 text-emerald-300"
            : "bg-white/[0.06] text-white/40",
        )}
      >
        {enabled ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
        {enabled ? "On" : "Off"}
      </span>
    </button>
  );
}

/** Live layer tuning panel (photo scale/offset, font, colour, motif toggles). */
export function LayerControls({ settings, onChange, className }: LayerControlsProps) {
  const patch = (partial: Partial<LayerSettings>) => onChange({ ...settings, ...partial });

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50">
        <Layers className="size-3.5 text-[#FFC107]" /> Layer Controls
      </h3>

      <SliderRow
        label="Photo Scale"
        value={settings.photoScale}
        min={0.6}
        max={1.4}
        step={0.02}
        suffix="x"
        onChange={(photoScale) => patch({ photoScale })}
      />

      <SliderRow
        label="Photo Position (Up/Down)"
        value={settings.photoOffsetY}
        min={-160}
        max={160}
        step={4}
        suffix="px"
        onChange={(photoOffsetY) => patch({ photoOffsetY })}
      />

      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
          <Type className="size-3.5" /> Bangla Font
        </span>
        <div className="grid grid-cols-2 gap-2">
          {BANGLA_FONTS.map((font) => (
            <button
              key={font}
              type="button"
              onClick={() => patch({ fontFamily: font })}
              style={{ fontFamily: `"${font}", system-ui, sans-serif` }}
              className={cn(
                "rounded-xl border px-2 py-2 text-[0.72rem] transition-colors",
                settings.fontFamily === font
                  ? "border-[#FFC107]/60 bg-[#FFC107]/10 text-[#FFC107]"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25",
              )}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
          <Palette className="size-3.5" /> Headline Color
        </span>
        <div className="flex gap-2">
          {HEADLINE_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Color ${color}`}
              onClick={() => patch({ headlineColor: color })}
              style={{ backgroundColor: color }}
              className={cn(
                "size-7 rounded-full border-2 transition-transform hover:scale-110",
                settings.headlineColor === color
                  ? "border-[#FFC107] ring-2 ring-[#FFC107]/40"
                  : "border-white/20",
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <ToggleRow
          label="Show Motifs / Ornaments"
          enabled={settings.showMotifs}
          onToggle={() => patch({ showMotifs: !settings.showMotifs })}
        />
        <ToggleRow
          label="Show Credit Footer"
          enabled={settings.showFooterBar}
          onToggle={() => patch({ showFooterBar: !settings.showFooterBar })}
        />
      </div>
    </div>
  );
}
