/**
 * Full-page ambient backdrop for the Sonar Bangla theme: obsidian base with
 * blurred emerald/gold mesh blobs and a masked grid for depth.
 * Purely decorative and non-interactive.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      {/* Bangladesh-themed mesh blobs */}
      <div className="absolute -left-[18%] -top-[22%] h-[42rem] w-[42rem] rounded-full bg-[#006A4E]/35 blur-[130px]" />
      <div className="absolute -right-[14%] top-[4%] h-[38rem] w-[38rem] rounded-full bg-[#FFC107]/16 blur-[140px]" />
      <div className="absolute bottom-[-20%] left-[22%] h-[34rem] w-[34rem] rounded-full bg-[#0A8A67]/25 blur-[150px]" />
      <div className="absolute right-[16%] bottom-[6%] h-[24rem] w-[24rem] rounded-full bg-[#F42A41]/14 blur-[130px]" />

      {/* Faint grid, radially masked so it fades toward the edges */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #000 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #000 20%, transparent 75%)",
        }}
      />

      {/* Top vignette to seat the header */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/60 to-transparent" />
    </div>
  );
}
