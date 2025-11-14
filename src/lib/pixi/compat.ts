// Pixi version-compat helpers (v6 vs v7)
import * as PIXI from 'pixi.js';

// Pixi v7 has async Application.init()
export const supportsAsyncInit =
  !!(PIXI as any)?.Application?.prototype?.init;

// Get the canvas element (v7: app.canvas, v6: app.view)
export function getCanvas(app: PIXI.Application | null): HTMLCanvasElement | null {
  if (!app) return null;
  const c = (app as any).canvas || (app as any).view;
  return (c ?? null) as HTMLCanvasElement | null;
}

// Safe renderer dimensions with fallback to canvas size
export function getRendererDims(app: PIXI.Application | null): { w: number; h: number } {
  if (!app) return { w: 0, h: 0 };
  const r = (app as any).renderer;
  const canvas = getCanvas(app);
  const w = r?.width ?? (canvas ? canvas.width : undefined);
  const h = r?.height ?? (canvas ? canvas.height : undefined);
  return { w: (w ?? 0), h: (h ?? 0) };
}
