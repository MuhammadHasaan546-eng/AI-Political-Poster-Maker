"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clock,
  Images,
  LayoutDashboard,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

const ADMIN_TABS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/templates", label: "Templates", icon: Images },
  { href: "/admin/posters", label: "Moderation", icon: Clock },
] as const;

/**
 * Client-side guard + chrome for the admin surface.
 *
 * The middleware already blocks unauthenticated/non-admin requests at the edge;
 * this re-checks the rehydrated session on the client so the UI never flashes
 * privileged content while `AuthProvider` is still resolving.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && (!user || user.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  if (!ready) {
    return (
      <PageShell>
        <div className="mx-auto grid max-w-[1360px] place-items-center px-5 py-24">
          <Loader2 className="size-7 animate-spin text-[#FFC107]" />
          <p className="mt-4 text-sm text-white/50">Verifying session…</p>
        </div>
      </PageShell>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-5 py-24 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#F42A41]/15 text-[#F42A41]">
            <ShieldAlert className="size-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-white">
            Admin access required
          </h1>
          <p className="mt-3 text-sm text-white/55">
            This page is restricted to administrators only.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-[1360px] px-5 py-10 sm:px-8 lg:py-14">
        <div className="flex flex-col gap-2 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#FFC107]">
              <ShieldCheck className="size-3.5" /> Admin Panel
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
              Platform Management
            </h1>
          </div>
          <p className="text-sm text-white/45">
            {user.name} · Administrator
          </p>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {ADMIN_TABS.map((tab) => {
            const active =
              tab.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "border-[#FFC107]/60 bg-[#FFC107]/10 text-[#FFC107]"
                    : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25 hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8">{children}</div>
      </div>
    </PageShell>
  );
}
