import { Quote, Star } from "lucide-react";

export function TestimonialCard() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-white p-7 shadow-2xl shadow-black/40 sm:p-9">
      {/* Decorative watermark quote */}
      <Quote
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -top-4 size-36 fill-[#7C3AED]/8 text-[#7C3AED]/8"
      />

      <div className="relative">
        {/* Quote glyph */}
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#7C3AED]/10">
          <Quote className="size-6 fill-[#7C3AED] text-[#7C3AED]" />
        </span>

        <blockquote className="mt-6 text-lg font-semibold leading-relaxed tracking-tight text-slate-900 sm:text-xl lg:text-[1.4rem] lg:leading-[1.55]">
          &ldquo;Nebula has completely transformed the way we build and scale
          products. It&rsquo;s fast, flexible, and beautifully simple.&rdquo;
        </blockquote>
      </div>

      {/* Author + rating */}
      <div className="relative mt-8 flex flex-wrap items-end justify-between gap-5 border-t border-slate-100 pt-7">
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-lg shadow-[#7C3AED]/25 ring-2 ring-white">
            SM
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Sofia Martinez</p>
            <p className="text-xs font-medium text-slate-500">
              Product Lead, Acme Inc.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div
            className="flex items-center gap-0.5 sm:justify-end"
            role="img"
            aria-label="Rated 4.9 out of 5 stars"
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className="size-4 fill-amber-400 text-amber-400"
              />
            ))}
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-900">
            4.9<span className="font-medium text-slate-400">/5</span>
          </p>
        </div>
      </div>
    </div>
  );
}
