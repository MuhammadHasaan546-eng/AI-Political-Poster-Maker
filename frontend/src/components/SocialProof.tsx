import { Award, Layers, ShieldCheck, Users } from "lucide-react";

const SIGNALS = [
  { icon: Users, label: "10,000+ Users" },
  { icon: Layers, label: "50+ Ready Templates" },
  { icon: ShieldCheck, label: "Secure Cloud Storage" },
  { icon: Award, label: "Pixel-perfect Bangla Typography" },
] as const;

/** Trust strip directly beneath the hero. */
export function SocialProof() {
  return (
    <section className="px-5 pb-10 sm:px-8">
      <div className="mx-auto max-w-[1360px]">
        <div className="glass-card flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-3xl px-6 py-5">
          {SIGNALS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-[#006A4E]/25 text-[#FFC107]">
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-semibold text-white/60">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
