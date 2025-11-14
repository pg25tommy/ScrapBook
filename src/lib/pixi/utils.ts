// Fast visuals: small noise tile + radial gradient
import * as PIXI from 'pixi.js';

/**
 * Create a small noise tile once (default 128x128) — super fast to render —
 * then we can repeat it with a TilingSprite at full screen.
 */
export function makeNoiseTile(
  app: PIXI.Application,
  size = 128,
  intensity = 0.12 // slightly stronger so it reads over warm paper
): PIXI.RenderTexture {
  const rt = PIXI.RenderTexture.create({ width: size, height: size } as any);
  const g = new PIXI.Graphics();

  const rnd = () => Math.floor(255 * (0.5 + (Math.random() - 0.5) * 2 * intensity));
  const step = 2; // tiny squares; still cheap because the tile is small

  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      g.beginFill((rnd() << 16) + (rnd() << 8) + rnd());
      g.drawRect(x, y, step, step);
      g.endFill();
    }
  }
  (app as any).renderer?.render(g as any, { renderTexture: rt } as any);
  g.destroy();
  return rt;
}

/** Big, soft radial gradient used for vignette */
export function radialGradientTexture(
  app: PIXI.Application,
  w: number,
  h: number,
  inner = 0x000000,
  outer = 0x000000,
  innerA = 0.0,
  outerA = 0.55
) {
  const rt = PIXI.RenderTexture.create({ width: w, height: h } as any);
  const gfx = new PIXI.Graphics();
  const cx = w / 2, cy = h / 2;
  const R = Math.hypot(w, h) / 2;
  const rings = 24;

  for (let i = rings; i >= 1; i--) {
    const t = i / rings;
    const a = innerA * (1 - t) + outerA * t;
    gfx.beginFill(outer, a);
    gfx.drawCircle(cx, cy, R * t);
    gfx.endFill();
  }
  (app as any).renderer?.render(gfx as any, { renderTexture: rt } as any);
  gfx.destroy();
  return rt;
}
