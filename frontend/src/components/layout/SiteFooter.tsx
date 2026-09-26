import Link from "next/link";
import { Globe, MessageCircle, Rss, Share2 } from "lucide-react";

/**
 * Footer link columns.
 *
 * The builder entry uses `{ builder: true }` rather than a hard-coded
 * `/builder/<id>`, so the actual link is resolved at runtime to a live template
 * ObjectId (falling back to the template selector).
 */
const COLUMNS: ReadonlyArray<{
  title: string;
  links: ReadonlyArray<{ href: string; label: string; builder?: boolean }>;
}> = [
  {
    title: "Platform",
    links: [
      { href: "/templates", label: "Template Library" },
      { href: "/templates", label: "Poster Builder", builder: true },
      { href: "/dashboard", label: "My Posters" },
    ],
  },
  {
    title: "Occasions",
    links: [
      { href: "/templates?occasion=victory-day", label: "Victory Day" },
      { href: "/templates?occasion=condolence", label: "Tribute & Remembrance" },
      { href: "/templates?occasion=election-campaign", label: "Election Campaign" },
      { href: "/templates?occasion=eid", label: "Greetings & Festivals" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/login", label: "Log In" },
      { href: "/register", label: "Register" },
      { href: "/templates", label: "User Guide" },
    ],
  },
];

/** The live template-selector destination for "start building" CTAs. */
const BUILDER_FALLBACK = "/templates";

export function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-white/[0.07] bg-[#0D1117]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFC107]/50 to-transparent" />
      <div className="mx-auto grid max-w-[1360px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-gradient">
              <span className="size-3 rounded-full border-2 border-[#FFC107]" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-extrabold text-white">
                Sonar Bangla
              </span>
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#FFC107]">
                Poster AI
              </span>
            </span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/45">
            An AI-powered poster creation platform for Bangladesh's political
            parties. Upload photos, enter your text — HD posters in seconds.
          </p>
          <div className="flex gap-2">
            {[Globe, MessageCircle, Share2, Rss].map((Icon, index) => (
              <span
                key={index}
                className="grid size-9 place-items-center rounded-xl border border-white/10 text-white/45 transition-colors hover:border-[#FFC107]/40 hover:text-[#FFC107]"
              >
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title} className="space-y-3">
            <h4 className="font-bangla text-sm font-bold text-white">{column.title}</h4>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.builder ? BUILDER_FALLBACK : link.href}
                    className="font-bangla text-sm text-white/45 transition-colors hover:text-[#FFC107]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-white/35" suppressHydrationWarning>
            © {new Date().getFullYear()} Sonar Bangla Poster AI — All rights reserved.
          </p>
          <p className="text-[0.7rem] font-medium uppercase tracking-wider text-white/25">
            Made in Bangladesh 🇧🇩
          </p>
        </div>
      </div>
    </footer>
  );
}
