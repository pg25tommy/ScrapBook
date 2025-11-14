import { describe, it, expect } from 'vitest';
import { getRendererDims, getCanvas } from '../lib/pixi/compat';

describe('pixi compat helpers', () => {
  it('returns safe zeros when app is null', () => {
    expect(getRendererDims(null)).toEqual({ w: 0, h: 0 });
    expect(getCanvas(null)).toBeNull();
  });

  it('prefers renderer dims when available', () => {
    const app: any = { renderer: { width: 800, height: 600 } };
    expect(getRendererDims(app)).toEqual({ w: 800, h: 600 });
  });

  it('falls back to canvas size when renderer missing', () => {
    const canvas = Object.assign(document.createElement('canvas'), { width: 320, height: 200 });
    const app: any = { renderer: null, view: canvas };
    expect(getRendererDims(app)).toEqual({ w: 320, h: 200 });
  });
});
