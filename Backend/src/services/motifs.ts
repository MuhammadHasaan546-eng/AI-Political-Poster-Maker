/**
 * Decorative motif library.
 *
 * Each motif returns a self-contained inline `<svg>` string. Wrappers control
 * position/size; the SVG itself scales to its container via `viewBox` +
 * `preserveAspectRatio`, so the same fragment works at any placement.
 *
 * All motifs are pure (no randomness) so a given poster always renders
 * identically — important for reproducible snapshots and print output.
 */

export interface MotifOptions {
  /** Primary motif color. */
  color?: string;
  /** Secondary / accent color. */
  accent?: string;
  /** 0..1 opacity applied to the root `<svg>`. */
  opacity?: number;
}

const defaultColor = '#FFC107';
const defaultAccent = '#006A4E';

function wrap(inner: string, viewBox: string, opts: MotifOptions): string {
  const color = opts.color ?? defaultColor;
  const accent = opts.accent ?? defaultAccent;
  const opacity = opts.opacity ?? 1;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%"`,
    ` preserveAspectRatio="xMidYMid meet" fill="none"`,
    ` style="--m:${color};--a:${accent};opacity:${opacity}" aria-hidden="true">`,
    inner,
    '</svg>',
  ].join('');
}

/** Peace dove silhouette (used for condolence / victory themes). */
function dove(opts: MotifOptions): string {
  return wrap(
    '<path d="M12 62c14-4 24-12 30-26 3-7 10-12 18-13-3 5-3 10-1 14 8-3 16-2 23 2-8 2-14 7-18 14-6 12-18 20-32 21-9 1-16-3-20-12z" fill="var(--m)"/>' +
      '<path d="M60 23c4-2 8-3 12-2-3 3-5 7-5 11 4-1 8 0 11 3-5 0-9 2-12 6-2-7-4-13-6-18z" fill="var(--a)"/>' +
      '<circle cx="78" cy="30" r="1.8" fill="var(--a)"/>',
    '0 0 100 90',
    opts,
  );
}

/** Five-pointed star. */
function star(opts: MotifOptions): string {
  return wrap(
    '<path d="M50 4l13.5 30.2 32.8 3.3-24.6 22 7 32.2L50 75.6 21.3 91.7l7-32.2-24.6-22 32.8-3.3z" fill="var(--m)"/>',
    '0 0 100 96',
    opts,
  );
}

/** National flag (green field + red disc), gently waved. */
function flag(opts: MotifOptions): string {
  return wrap(
    '<path d="M1 8h98l-8 34 8 34H1l7-34z" fill="var(--a)"/>' +
      '<circle cx="45" cy="42" r="17" fill="var(--m)"/>',
    '0 0 100 84',
    opts,
  );
}

/** Rice paddy stalk (agriculture / prosperity). */
function paddy(opts: MotifOptions): string {
  const grains = Array.from({ length: 7 }, (_, i) => {
    const y = 16 + i * 9;
    const lean = i * 1.6;
    return (
      `<ellipse cx="${34 - lean}" cy="${y}" rx="5" ry="3.4" transform="rotate(-38 ${34 - lean} ${y})" fill="var(--m)"/>` +
      `<ellipse cx="${48 + lean * 0.4}" cy="${y + 4}" rx="5" ry="3.4" transform="rotate(38 ${48 + lean * 0.4} ${y + 4})" fill="var(--m)"/>`
    );
  }).join('');
  return wrap(
    '<path d="M42 84C40 60 40 34 44 12" stroke="var(--a)" stroke-width="3" stroke-linecap="round"/>' + grains,
    '0 0 100 96',
    opts,
  );
}

/** Crescent moon (Eid / Ramadan). */
function crescent(opts: MotifOptions): string {
  return wrap(
    '<path d="M62 10a40 40 0 100 76 32 32 0 110-76z" fill="var(--m)"/>' +
      '<path d="M74 24l4.2 9.4 10.2 1-7.6 6.9 2.1 10-8.9-5.6-8.9 5.6 2.1-10-7.6-6.9 10.2-1z" fill="var(--a)"/>',
    '0 0 100 96',
    opts,
  );
}

/** Fanoos lantern (Ramadan). */
function lantern(opts: MotifOptions): string {
  return wrap(
    '<path d="M50 6v8M38 18h24M30 30c0-6 9-12 20-12s20 6 20 12v22c0 10-9 18-20 18s-20-8-20-18z" stroke="var(--m)" stroke-width="3"/>' +
      '<path d="M32 30h36M28 74h44" stroke="var(--m)" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="50" cy="45" r="10" fill="var(--m)"/>' +
      '<path d="M50 78v12" stroke="var(--m)" stroke-width="3" stroke-linecap="round"/>',
    '0 0 100 96',
    opts,
  );
}

/** Laurel wreath (memorial / condolence). */
function wreath(opts: MotifOptions): string {
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const left = i % 2 === 0;
    const angle = -60 + i * 15;
    const rad = (angle * Math.PI) / 180;
    const cx = 50 + Math.cos(rad) * 34;
    const cy = 46 + Math.sin(rad) * 34;
    return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="7" ry="3.2" transform="rotate(${angle + 30} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="var(--a)" opacity="0.9"/>`;
  }).join('');
  return wrap(
    '<path d="M50 88C24 78 12 60 12 42 12 24 26 12 50 12s38 12 38 30c0 18-12 36-38 46z" stroke="var(--m)" stroke-width="3" fill="none"/>' +
      leaves +
      '<circle cx="50" cy="46" r="6" fill="var(--m)"/>',
    '0 0 100 96',
    opts,
  );
}

/** Awareness ribbon (congratulation / causes). */
function ribbon(opts: MotifOptions): string {
  return wrap(
    '<path d="M50 14c-12 0-20 9-20 20 0 12 10 20 20 32 10-12 20-20 20-32 0-11-8-20-20-20z" fill="var(--m)"/>' +
      '<path d="M50 66l-16 24M50 66l16 24" stroke="var(--a)" stroke-width="4" stroke-linecap="round"/>',
    '0 0 100 96',
    opts,
  );
}

/** Party balloons (birthday). */
function balloon(opts: MotifOptions): string {
  const one = (cx: number, cy: number, fill: string) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="13" ry="16" fill="${fill}"/>` +
    `<path d="M${cx} ${cy + 16}l-4 6h8z" fill="${fill}"/>` +
    `<path d="M${cx} ${cy + 22}c6 10-6 16 0 26" stroke="var(--a)" stroke-width="1.6" fill="none"/>`;
  return wrap(
    one(30, 30, 'var(--m)') + one(70, 24, 'var(--a)') + one(50, 44, 'var(--m)'),
    '0 0 100 96',
    opts,
  );
}

/** Scattered confetti dots (birthday / celebration). */
function confetti(opts: MotifOptions): string {
  const dots = [
    [16, 20],
    [34, 12],
    [58, 22],
    [80, 16],
    [24, 46],
    [48, 40],
    [72, 50],
    [88, 38],
    [38, 72],
    [64, 74],
  ]
    .map(
      ([x, y], i) =>
        `<rect x="${x}" y="${y}" width="6" height="6" rx="1.6" transform="rotate(${i * 24} ${x + 3} ${y + 3})" fill="${i % 2 ? 'var(--a)' : 'var(--m)'}"/>`,
    )
    .join('');
  return wrap(dots, '0 0 100 96', opts);
}

/** Ornate corner flourish (floral border accents). */
function floral(opts: MotifOptions): string {
  return wrap(
    '<path d="M2 60C2 26 26 2 60 2" stroke="var(--m)" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M14 58c0-22 18-40 40-40" stroke="var(--a)" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M30 34c8-10 20-14 30-10-6 8-16 14-30 10z" fill="var(--m)"/>' +
      '<path d="M34 30c-10 8-14 20-10 30 8-6 14-16 10-30z" fill="var(--a)"/>' +
      '<circle cx="60" cy="2" r="5" fill="var(--m)"/>' +
      '<circle cx="2" cy="60" r="5" fill="var(--m)"/>' +
      '<circle cx="46" cy="14" r="3" fill="var(--a)"/>' +
      '<circle cx="14" cy="46" r="3" fill="var(--a)"/>',
    '0 0 64 64',
    opts,
  );
}

const MOTIF_BUILDERS: Record<string, (opts: MotifOptions) => string> = {
  dove,
  star,
  flag,
  paddy,
  crescent,
  lantern,
  wreath,
  ribbon,
  balloon,
  confetti,
  floral,
};

/** Every motif id the renderer understands. */
export const MOTIF_IDS = Object.keys(MOTIF_BUILDERS);

/** Render a motif by id, returning `''` for unknown ids. */
export function motifSvg(id: string, opts: MotifOptions = {}): string {
  const builder = MOTIF_BUILDERS[id];
  return builder ? builder(opts) : '';
}
