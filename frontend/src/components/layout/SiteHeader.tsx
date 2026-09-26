"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  User2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useBuilderHref } from "@/lib/use-builder-href";
import { cn } from "@/lib/utils";

/**
 * Static nav entries. The builder href is resolved to a live template id at
 * runtime, so `match` (not `href`) drives the active state — otherwise both
 * entries would highlight at once when the builder falls back to `/templates`.
 */
const NAV_LINKS = [
  { key: "templates", href: "/templates", match: "/templates", label: "Templates", labelEn: "Templates" },
  { key: "builder", href: "/templates", match: "/builder", label: "Create Poster", labelEn: "Builder" },
  { key: "dashboard", href: "/dashboard", match: "/dashboard", label: "Dashboard", labelEn: "Dashboard" },
] as const;

/** Brand mark: stylised rising sun over emerald field. */
function SonarMark() {
  return (
    <span className="grid size-9 place-items-center rounded-xl bg-emerald-gradient shadow-lg shadow-[#006A4E]/40">
      <span className="relative grid size-5 place-items-center">
        <span className="absolute size-5 rounded-full border-2 border-[#FFC107]" />
        <span className="size-2 rounded-full bg-[#F42A41]" />
      </span>
    </span>
  );
}

/** Global app navigation with auth-aware actions and a mobile drawer. */
export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout, ready } = useAuth();
  const builderHref = useBuilderHref();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /** Nav entries with the builder link pointed at a live template. */
  const navLinks = useMemo(
    () =>
      NAV_LINKS.map((link) =>
        link.key === "builder" ? { ...link, href: builderHref } : link,
      ),
    [builderHref],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-[90] w-full transition-all duration-300",
        scrolled ? "glass-nav border-b border-white/[0.07]" : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <SonarMark />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-extrabold tracking-tight text-white">
              Sonar Bangla
            </span>
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#FFC107]">
              Poster AI
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active =
              pathname === link.match || pathname.startsWith(`${link.match}/`);
            return (
              <li key={link.key}>
                <Link
                  href={link.href}
                  className={cn(
                    "font-bangla relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                    active ? "text-[#FFC107]" : "text-white/65 hover:text-white",
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-[#FFC107]"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-2.5 lg:flex">
          {ready && user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="font-bangla inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#FFC107] transition-colors hover:bg-[#FFC107]/10"
                >
                  <ShieldCheck className="size-4" /> Admin
                </Link>
              )}
              <Link href="/dashboard" className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                <span className="grid size-8 place-items-center rounded-lg bg-[#FFC107]/15 text-[#FFC107]">
                  <User2 className="size-4" />
                </span>
                <span className="max-w-[10rem] truncate text-sm font-semibold text-white/85">
                  {user.name}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="size-4" />}
              >
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-bangla rounded-xl px-3.5 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Log In
              </Link>
              <Link href="/register">
                <Button
                  variant="gold"
                  size="sm"
                  leftIcon={<Sparkles className="size-4" />}
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
          className="grid size-10 place-items-center rounded-xl border border-white/10 text-white/80 lg:hidden"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-nav overflow-hidden border-t border-white/[0.07] lg:hidden"
          >
            <ul className="space-y-1 px-5 py-4">
              {navLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="font-bangla flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-white/80 hover:bg-white/[0.05]"
                  >
                    {link.label}
                    <span className="text-[0.7rem] uppercase tracking-wider text-white/35">
                      {link.labelEn}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                {ready && user ? (
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={logout}
                    leftIcon={<LogOut className="size-4" />}
                  >
                    Log Out
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login">
                      <Button variant="outline" fullWidth>
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="gold" fullWidth>
                        Register
                      </Button>
                    </Link>
                  </div>
                )}
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/50"
                >
                  <LayoutDashboard className="size-4" />
                  <span>My Posters</span>
                </Link>
              </li>
              {ready && user?.role === "admin" && (
                <li>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#FFC107]"
                  >
                    <ShieldCheck className="size-4" />
                    <span>Admin Panel</span>
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
