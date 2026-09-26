import Link from "next/link";
import type { ReactNode } from "react";
import { PosterThumbnail } from "@/components/poster/PosterCanvas";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { MOCK_TEMPLATES } from "@/lib/mock-data";
import type { PosterFormData } from "@/lib/types";

const COLLAGE: PosterFormData = {
  occasionType: "victory-day",
  headline: "Great Victory Day",
  name: "Brave Bengali",
  designation: "Immortal",
  organization: "Bangladesh",
  unionThanaJela: "1971",
  partyName: "",
  promoteBy: "Promoted by — Sonar Bangla",
};

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-emerald-gradient shadow-lg shadow-[#006A4E]/40">
        <span className="size-3 rounded-full border-2 border-[#FFC107]" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-extrabold text-white">Sonar Bangla</span>
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#FFC107]">
          Poster AI
        </span>
      </span>
    </Link>
  );
}

/**
 * Split-screen chrome for /login and /register: form on the left,
 * a blurred poster collage echoing the brand on the right.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const collage = MOCK_TEMPLATES.slice(0, 4);

  return (
    <>
      <AmbientBackground />
      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Form column */}
        <div className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <BrandMark />

            <div className="mt-9">
              <h1 className="font-bangla text-3xl font-extrabold tracking-tight text-white">
                {title}
              </h1>
              <p className="font-bangla mt-2 text-sm leading-relaxed text-white/55">
                {subtitle}
              </p>
            </div>

            <div className="mt-8">{children}</div>

            {footer && (
              <div className="font-bangla mt-6 text-center text-sm text-white/50">
                {footer}
              </div>
            )}

            <p className="mt-10 text-center text-[0.7rem] text-white/30">
              By registering you agree to our terms and conditions.
            </p>
          </div>
        </div>

        {/* Decorative collage column */}
        <div className="relative hidden overflow-hidden border-l border-white/[0.07] lg:block">
          <div className="absolute inset-0 bg-emerald-gradient opacity-40" />
          <div className="absolute inset-0 backdrop-blur-2xl" />
          <div className="relative grid h-full grid-cols-2 gap-4 p-10">
            {collage.map((template, index) => (
              <div
                key={template.id}
                className={
                  "overflow-hidden rounded-2xl border border-white/10 bg-[#0D1117] shadow-2xl shadow-black/40 " +
                  (index % 2 === 0 ? "translate-y-6" : "-translate-y-2")
                }
                style={{ opacity: 0.5 + (index % 3) * 0.18 }}
              >
                <div className="aspect-[3/4]">
                  <PosterThumbnail layout={template.layoutConfig} formData={COLLAGE} />
                </div>
              </div>
            ))}
          </div>

          <div className="absolute inset-x-10 bottom-12 rounded-3xl border border-white/10 bg-[#0D1117]/70 p-6 backdrop-blur-xl">
            <p className="text-lg font-bold leading-snug text-white">
              “Your poster is your message — ready in moments.”
            </p>
            <p className="mt-2 text-xs text-white/50">
              AI-powered Bangla typography with pixel-perfect HD rendering
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
