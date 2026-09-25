import puppeteer, { type Browser } from 'puppeteer-core';
import { env } from '../config/env';
import { buildPosterHtml, type BuildPosterHtmlInput } from './layout';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../types/layout';

/**
 * Server-side render pipeline.
 *
 * Renders poster HTML in a real (headless) Chrome and captures print-ready
 * raster/vector output. Chrome is launched once and reused; concurrent renders
 * are gated by `RENDER_CONCURRENCY` so the process cannot be overwhelmed.
 *
 * Output resolution: the viewport is {@link CANVAS_WIDTH}x{@link CANVAS_HEIGHT}
 * CSS pixels at deviceScaleFactor 2, yielding a 2400x3200 PNG.
 */

/** Device scale factor used for print-ready output. */
export const DEVICE_SCALE_FACTOR = 2;

/** Chrome launched headlessly — flags tuned for containers / CI. */
const CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--font-render-hinting=none',
  '--hide-scrollbars',
  '--force-color-profile=srgb',
];

let browserPromise: Promise<Browser> | null = null;

/** Launch (once) and return the shared headless browser. */
async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        executablePath: env.CHROME_EXECUTABLE_PATH,
        headless: true,
        args: CHROME_ARGS,
        protocolTimeout: env.RENDER_TIMEOUT_MS + 15_000,
      })
      .catch((error: unknown) => {
        // Reset so a later attempt can retry a failed launch.
        browserPromise = null;
        throw error;
      });
  }
  return browserPromise;
}

/** Close the shared browser (called on graceful shutdown). */
export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    // Already closed / never launched.
  } finally {
    browserPromise = null;
  }
}

/* ------------------------------------------------------------------ *
 * Concurrency gate.
 * ------------------------------------------------------------------ */

let active = 0;
const waiters: Array<() => void> = [];

function acquire(): Promise<void> {
  if (active < env.RENDER_CONCURRENCY) {
    active += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    waiters.push(() => {
      active += 1;
      resolve();
    });
  });
}

function release(): void {
  active -= 1;
  const next = waiters.shift();
  if (next) next();
}

/** Run `fn` while holding one of the `RENDER_CONCURRENCY` render slots. */
async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * Minimal structural types for the in-page DOM, declared locally because this
 * backend project compiles without the `dom` lib.
 */
interface PageImage {
  complete: boolean;
  addEventListener: (type: string, listener: () => void, options?: { once?: boolean }) => void;
}

interface PageDocument {
  fonts?: { ready?: Promise<unknown> };
  images: ArrayLike<PageImage>;
}

/** Wait for web fonts + all `<img>` elements to finish loading. */
async function waitForAssets(page: import('puppeteer-core').Page): Promise<void> {
  await page.evaluate(async () => {
    const scope = globalThis as unknown as {
      document: PageDocument;
      setTimeout: (handler: () => void, timeout: number) => unknown;
    };

    const fonts = scope.document.fonts;
    if (fonts?.ready) {
      try {
        await fonts.ready;
      } catch {
        // Font loading API unavailable — best effort only.
      }
    }

    const images = Array.from(scope.document.images);
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
            // Never hang the render on a stalled asset.
            scope.setTimeout(resolve, 4000);
          }),
      ),
    );
  });
}

/** Render arbitrary HTML at the canonical poster size to a PNG buffer. */
export async function renderHtmlToPng(html: string): Promise<Buffer> {
  return withSlot(async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setViewport({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        deviceScaleFactor: DEVICE_SCALE_FACTOR,
      });
      await page.setContent(html, { waitUntil: 'load', timeout: env.RENDER_TIMEOUT_MS });
      await waitForAssets(page);

      const buffer = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
        captureBeyondViewport: false,
      });
      return Buffer.from(buffer);
    } finally {
      await page.close().catch(() => undefined);
    }
  });
}

/** Render arbitrary HTML at the canonical poster size to a PDF buffer. */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  return withSlot(async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setViewport({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        deviceScaleFactor: 1,
      });
      await page.setContent(html, { waitUntil: 'load', timeout: env.RENDER_TIMEOUT_MS });
      await waitForAssets(page);

      const buffer = await page.pdf({
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        printBackground: true,
        pageRanges: '1',
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return Buffer.from(buffer);
    } finally {
      await page.close().catch(() => undefined);
    }
  });
}

/** Build the poster HTML and render it to PNG in one call. */
export async function renderPosterPng(input: BuildPosterHtmlInput): Promise<Buffer> {
  return renderHtmlToPng(buildPosterHtml(input));
}

/** Build the poster HTML and render it to PDF in one call. */
export async function renderPosterPdf(input: BuildPosterHtmlInput): Promise<Buffer> {
  return renderHtmlToPdf(buildPosterHtml(input));
}
