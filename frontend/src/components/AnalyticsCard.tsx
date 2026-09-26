import { Activity, Clock, Eye, Target, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NeonAreaChart } from "./ui/NeonAreaChart";

type Metric = {
  label: string;
  value: string;
  trend?: string;
  icon: LucideIcon;
};

const metrics: Metric[] = [
  { label: "Total Views", value: "1.2M", trend: "18.8%", icon: Eye },
  { label: "Avg. Session", value: "24.3%", trend: "5.2%", icon: Activity },
  { label: "Duration", value: "3m 24s", icon: Clock },
  { label: "Conversion", value: "8.6%", icon: Target },
];

export function AnalyticsCard() {
  return (
    <div className="glass-card relative flex h-full flex-col overflow-hidden rounded-3xl p-6 sm:p-8">
      {/* Ambient corner glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-[#7C3AED]/25 blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 size-64 rounded-full bg-[#EC4899]/20 blur-[90px]"
      />

      {/* Header */}
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Real-time Analytics
            </h2>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            98.7K{" "}
            <span className="text-lg font-semibold text-white/60 sm:text-xl">
              Active Users
            </span>
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
          <TrendingUp className="size-3.5" />
          +24.5%
          <span className="font-medium text-emerald-300/60">vs last week</span>
        </span>
      </div>

      {/* Chart */}
      <div className="relative mt-6 flex-1">
        <NeonAreaChart className="h-52 w-full sm:h-60" />
      </div>

      {/* Footer metrics */}
      <dl className="relative mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-6 sm:grid-cols-4 sm:gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.05]"
            >
              <dt className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-white/45">
                <Icon className="size-3.5" />
                {metric.label}
              </dt>
              <dd className="mt-2 flex items-baseline gap-1.5">
                <span className="text-base font-bold text-white sm:text-lg">
                  {metric.value}
                </span>
                {metric.trend && (
                  <span className="text-[0.7rem] font-bold text-emerald-400">
                    ▲ {metric.trend}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
