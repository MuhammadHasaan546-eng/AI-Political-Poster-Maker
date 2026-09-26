type LiquidShapeProps = {
  /** Two-stop gradient used for the fluid body. */
  colors: [string, string];
  className?: string;
  /** Slows the morph cycle for large hero-scale shapes. */
  slow?: boolean;
};

/**
 * Organic 3D "liquid" fluid shape built from layered gradients and a
 * CSS border-radius morph. Used in the hero and feature card visuals.
 */
export function LiquidShape({
  colors,
  className = "",
  slow = false,
}: LiquidShapeProps) {
  const [from, to] = colors;

  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      {/* Soft glow aura */}
      <div
        className="absolute inset-[6%] rounded-full opacity-60 blur-3xl"
        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      />

      {/* Fluid body */}
      <div
        className={`absolute inset-[10%] ${
          slow ? "animate-blob" : "animate-blob [animation-duration:14s]"
        }`}
        style={{
          backgroundImage: `radial-gradient(120% 120% at 28% 18%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 46%), linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
          borderRadius: "62% 38% 46% 54% / 58% 44% 56% 42%",
          boxShadow: `inset -18px -22px 60px rgba(0,0,0,0.35), 0 30px 80px -30px ${to}`,
        }}
      />

      {/* Specular highlight */}
      <div className="absolute left-[24%] top-[20%] h-[16%] w-[24%] rounded-full bg-white/45 blur-lg" />
      <div className="absolute bottom-[26%] right-[26%] h-[10%] w-[14%] rounded-full bg-white/25 blur-md" />
    </div>
  );
}
