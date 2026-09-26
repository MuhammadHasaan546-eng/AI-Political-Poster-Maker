"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Images,
  Loader2,
  RefreshCw,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { useToast } from "@/components/providers/ToastProvider";
import {
  apiAdminLogs,
  apiAdminStats,
  type AdminStats,
  type GenerationLogEntry,
} from "@/lib/api-client";
import { cn, formatDate } from "@/lib/utils";

function StatTile({
  icon,
  label,
  value,
  hint,
  tone = "gold",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "gold" | "emerald" | "red";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "red"
        ? "text-[#F42A41]"
        : "text-[#FFC107]";
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 text-white/50">
        <span className={cn("grid size-8 place-items-center rounded-xl bg-white/[0.05]", toneClass)}>
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

export default function AdminOverviewPage() {
  const { error: toastError } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<GenerationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStats, nextLogs] = await Promise.all([
        apiAdminStats(),
        apiAdminLogs(),
      ]);
      setStats(nextStats);
      setLogs(nextLogs);
    } catch {
      toastError("Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading && !stats) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-7 animate-spin text-[#FFC107]" />
        <p className="mt-4 text-sm text-white/50">Loading data…</p>
      </div>
    );
  }

  const successRate =
    stats && stats.logs.total > 0
      ? Math.round((stats.logs.success / stats.logs.total) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Platform Statistics</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refresh()}
          leftIcon={<RefreshCw className={cn("size-4", loading && "animate-spin")} />}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={<Images className="size-4" />} label="Total Posters" value={stats?.posters.total ?? 0} />
        <StatTile
          icon={<CheckCircle2 className="size-4" />}
          label="Completed"
          value={stats?.posters.completed ?? 0}
          tone="emerald"
        />
        <StatTile
          icon={<Clock className="size-4" />}
          label="In Progress"
          value={stats?.posters.generating ?? 0}
        />
        <StatTile
          icon={<XCircle className="size-4" />}
          label="Failed"
          value={stats?.posters.failed ?? 0}
          tone="red"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={<Gauge className="size-4" />}
          label="Success Rate"
          value={`${successRate}%`}
          hint={`${stats?.logs.success ?? 0}/${stats?.logs.total ?? 0} jobs`}
          tone="emerald"
        />
        <StatTile
          icon={<Activity className="size-4" />}
          label="Avg. Latency"
          value={`${stats?.logs.avgLatencyMs ?? 0}ms`}
          hint="per generation"
        />
        <StatTile
          icon={<Zap className="size-4" />}
          label="Total Tokens"
          value={stats?.logs.totalTokens ?? 0}
          hint="estimated"
        />
        <StatTile
          icon={<Users className="size-4" />}
          label="Users"
          value={stats?.users.total ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm font-bold text-white">Template Library</p>
          <div className="mt-3 flex items-end gap-4">
            <span className="font-bangla text-3xl font-extrabold text-[#FFC107] tabular-nums">
              {stats?.templates.total ?? 0}
            </span>
            <span className="pb-1 text-xs text-white/45">
              total · active {stats?.templates.active ?? 0}
            </span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm font-bold text-white">Generation Queue</p>
          <div className="mt-3 flex items-end gap-4">
            <span className="font-bangla text-3xl font-extrabold text-[#FFC107] tabular-nums">
              {stats?.posters.pending ?? 0}
            </span>
            <span className="pb-1 text-xs text-white/45">pending</span>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/50">
          <Activity className="size-4 text-[#FFC107]" /> Recent Generation Logs
        </h2>

        {logs.length === 0 ? (
          <div className="glass-card grid place-items-center rounded-3xl px-6 py-14 text-center">
            <p className="text-sm text-white/50">No logs yet.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-white/[0.07] text-[0.7rem] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Poster</th>
                    <th className="px-5 py-3 font-semibold">Latency</th>
                    <th className="px-5 py-3 font-semibold">Tokens</th>
                    <th className="px-5 py-3 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 25).map((log) => (
                    <tr key={log.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-5 py-3">
                        <Badge tone={log.success ? "emerald" : "red"}>
                          {log.success ? "Success" : "Failed"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-white/60">
                        {log.posterId.slice(-8)}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-white/70">{log.latencyMs}ms</td>
                      <td className="px-5 py-3 tabular-nums text-white/70">{log.tokenEstimate}</td>
                      <td className="px-5 py-3 text-xs text-white/45">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {logs.some((log) => log.errorMessage) && (
          <div className="glass-card space-y-2 rounded-2xl border-red-500/25 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-[#F42A41]">
              <AlertTriangle className="size-4" /> Recent Errors
            </p>
            {logs
              .filter((log) => log.errorMessage)
              .slice(0, 3)
              .map((log) => (
                <p key={log.id} className="font-mono text-[0.7rem] text-white/55">
                  {log.posterId.slice(-8)}: {log.errorMessage}
                </p>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
