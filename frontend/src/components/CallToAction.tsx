import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

/** Closing conversion band. */
export function CallToAction() {
  return (
    <section id="start" className="relative px-5 pb-20 sm:px-8 lg:pb-28">
      <div className="mx-auto max-w-[1360px]">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-emerald-gradient px-6 py-14 text-center shadow-2xl shadow-black/50 sm:px-12 lg:py-20">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,193,7,0.9), transparent 45%), radial-gradient(circle at 80% 80%, rgba(244,42,65,0.7), transparent 45%)",
              }}
            />

            <div className="relative mx-auto max-w-2xl">
              <span className="glass-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#0D1117]">
                <Sparkles className="size-3.5" />
                <span>Start Completely Free</span>
              </span>

              <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Create Your First Poster Today
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
                Register, upload photos — download an HD poster in just a few seconds.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register" className="w-full sm:w-auto">
                  <span className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D1117] px-7 text-base font-bold text-white shadow-xl transition-transform hover:-translate-y-0.5 sm:w-auto">
                    <span>Free Registration</span>
                    <ArrowRight className="size-5" />
                  </span>
                </Link>
                <Link href="/templates" className="w-full sm:w-auto">
                  <span className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/40 px-7 text-base font-bold text-white transition-colors hover:bg-white/10 sm:w-auto">
                    Browse Templates
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
