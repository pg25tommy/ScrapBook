import * as PIXI from 'pixi.js';
import { BlurFilter } from 'pixi.js';
import { getCanvas, getRendererDims, supportsAsyncInit } from './compat';
import { getTapeTexture } from './tapeTextures';
import type { Slot, SlotContent } from '../../state/useLightTableStore';

type EngineOpts = {
  onRequestFill?: () => Promise<void> | void;
  safeInsets?: { top: number; left: number; right: number; bottom: number };
};

export class LightTableEngine {
  app: PIXI.Application | null = null;

  world: PIXI.Container | null = null;
  loupeContainer: PIXI.Container | null = null;

  view = { x: 0, y: 0, scale: 1 };

  private resizeTimer?: number;
  private onRequestFill?: () => Promise<void> | void;
  private currentSlot?: Slot;
  private safeInsets = { top: 84, left: 12, right: 12, bottom: 56 };

  private loupeEnabled = false;
  private mouseX = 0;
  private mouseY = 0;
  private isFlipped = false;

  constructor(opts?: EngineOpts) {
    this.onRequestFill = opts?.onRequestFill;
    if (opts?.safeInsets) this.safeInsets = opts.safeInsets;
  }

  async init(container: HTMLDivElement) {
    if (this.app) return;

    const appOpts: any = {
      resizeTo: container,
      antialias: true,
      backgroundAlpha: 0,
      autoDensity: true,
      powerPreference: 'high-performance',
    };

    if (supportsAsyncInit) {
      const app = new PIXI.Application() as any;
      await app.init(appOpts);
      this.app = app as PIXI.Application;
    } else {
      this.app = new PIXI.Application(appOpts);
    }

    // Ensure zIndex ordering
    (this.app!.stage as any).sortableChildren = true;

    container.appendChild((this.app as any).canvas || (this.app as any).view);

    this.world = new PIXI.Container();
    (this.world as any).sortableChildren = true;
    this.app!.stage.addChild(this.world);

    // Loupe layer (rendered on top)
    this.loupeContainer = new PIXI.Container();
    this.loupeContainer.zIndex = 2000;
    this.app!.stage.addChild(this.loupeContainer);

    const ro = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        try { (this.app as any)?.resize?.(); } catch {}
        this.clampView();
      }, 80);
    });
    ro.observe(container);

    const canvas = getCanvas(this.app)!;
    canvas.addEventListener('pointerdown', () => (document.body.style.userSelect = 'none'));
    canvas.addEventListener('pointerup', () => (document.body.style.userSelect = ''));
    (canvas as any).addEventListener?.('pointerupoutside', () => (document.body.style.userSelect = ''));

    // Track mouse position for loupe
    canvas.addEventListener('pointermove', (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ev.clientX - rect.left;
      this.mouseY = ev.clientY - rect.top;
    });
  }

  async setSlot(slot: Slot) {
    if (!this.world || !this.app) return;
    this.currentSlot = slot;

    this.world.removeChildren();

    const frame = this.buildFrame(slot);
    frame.position.set(slot.x, slot.y);
    this.world.addChild(frame);

    if (this.isFlipped) {
      // Show the back of the photo with text
      // Create container for both background and text
      const backContainer = new PIXI.Container();

      // Add aged paper background
      const bg = this.makeBackgroundForFlipped(slot);
      backContainer.addChild(bg);

      // Add text on top
      const textContent = this.makeBackContent(slot);
      backContainer.addChild(textContent);

      // Add to frame WITHOUT masking (back doesn't need clipping)
      backContainer.zIndex = 4;
      frame.addChild(backContainer);
    } else {
      // Show the front with photo/content
      if (slot.content) {
        try {
          const node = await this.makeContent(slot, slot.content);
          this.maskIntoFrame(frame, node);
        } catch (e) {
          console.error('Failed to build slot content:', e);
        }
      } else {
        const plus = new PIXI.Graphics();
        plus.lineStyle(3, 0x9b8e7a, 0.9)
          .moveTo(0, -18).lineTo(0, 18)
          .moveTo(-18, 0).lineTo(18, 0);
        plus.alpha = 0.7;
        this.maskIntoFrame(frame, plus);
      }
    }

    this.clampView();
  }

  setLoupeEnabled(enabled: boolean) {
    this.loupeEnabled = enabled;
    if (!enabled && this.loupeContainer) {
      this.loupeContainer.removeChildren();
    }
  }

  setFlipped(flipped: boolean) {
    this.isFlipped = flipped;
    if (this.currentSlot) {
      this.setSlot(this.currentSlot);
    }
  }

  private buildFrame(slot: Slot): PIXI.Container {
    const cont = new PIXI.Container();
    (cont as any).sortableChildren = true;

    const border = 16;
    const bottomExtra = 28;
    const frameW = slot.width + border * 2;
    const frameH = slot.height + border * 2 + bottomExtra;

    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.25)
      .drawRoundedRect(-frameW / 2, -frameH / 2, frameW, frameH, 8)
      .endFill();
    shadow.position.set(4, 6);
    const blur = new BlurFilter();
    (blur as any).strength = 6;
    (shadow as any).filters = [blur];
    shadow.zIndex = 1;
    cont.addChild(shadow);

    const matte = new PIXI.Graphics();
    matte.beginFill(0xffffff, 0.98)
      .drawRoundedRect(-frameW / 2, -frameH / 2, frameW, frameH, 8)
      .endFill();
    matte.zIndex = 2;
    cont.addChild(matte);

    const opening = new PIXI.Graphics();
    opening.beginFill(0x000000, 1)
      .drawRoundedRect(
        -slot.width / 2,
        -(slot.height + bottomExtra / 2) / 2,
        slot.width,
        slot.height,
        2
      )
      .endFill();
    opening.visible = false;
    opening.zIndex = 3;
    cont.addChild(opening);

    const tapeTargetW = Math.min(frameW * 0.42, 220);
    const t1 = new PIXI.Sprite(getTapeTexture(1));
    const t2 = new PIXI.Sprite(getTapeTexture(2));
    t1.scale.set(tapeTargetW / t1.texture.width);
    t2.scale.set(tapeTargetW / t2.texture.width);
    t1.anchor.set(0.5); t2.anchor.set(0.5);
    t1.alpha = 0.96; t2.alpha = 0.96;
    t1.position.set(-frameW / 2 + 56, -frameH / 2 + 40);
    t1.rotation = -0.32;
    t2.position.set(frameW / 2 - 50, frameH / 2 - 48);
    t2.rotation = 0.28;
    t1.zIndex = 50; t2.zIndex = 50;
    (t1 as any).eventMode = 'none';
    (t2 as any).eventMode = 'none';
    cont.addChild(t1, t2);

    (cont as any).eventMode = 'static';
    (cont as any).interactive = true;
    (cont as any).cursor = 'pointer';
    (cont as any).onpointertap = () => this.onRequestFill?.();

    (cont as any).__opening__ = opening;
    return cont;
  }

  private maskIntoFrame(frame: PIXI.Container, node: any) {
    const opening: PIXI.Graphics = (frame as any).__opening__;
    (node as any).mask = opening;
    node.zIndex = 4;
    frame.addChild(node as any);
  }

  /** Robust loader that works for both same-origin and proxied URLs */
  private async loadImageTexture(url: string): Promise<PIXI.Texture> {
    try {
      const tex = await (PIXI as any).Texture.fromURL(url, {
        resourceOptions: { crossorigin: '' },
      });
      return tex as PIXI.Texture;
    } catch (e) {
      console.warn('Texture.fromURL failed, falling back to blob pipeline:', e);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`fetch failed ${res.status}`);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      try {
        const img = new Image();
        img.src = objUrl;
        try { /* @ts-ignore */ await img.decode?.(); } catch {}
        return PIXI.Texture.from(img);
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    }
  }

  private async makeContent(slot: Slot, content: SlotContent): Promise<any> {
    const bottomExtra = 28;

    if (content.kind === 'image') {
      const tex = await this.loadImageTexture(content.src);
      const sp = new PIXI.Sprite(tex);
      sp.anchor.set(0.5);

      const iw = tex.width || sp.texture.width;
      const ih = tex.height || sp.texture.height;
      const rw = slot.width / iw;
      const rh = slot.height / ih;
      const scale = (content.fit === 'contain' ? Math.min(rw, rh) : Math.max(rw, rh));
      sp.scale.set(scale);
      sp.y = -(bottomExtra * 0.25);
      return sp;
    } else {
      const style = new PIXI.TextStyle({
        fontFamily: 'ui-rounded, system-ui, -apple-system, Segoe UI',
        fontSize: 18,
        fill: 0x1a1a1a,
        wordWrap: true,
        wordWrapWidth: slot.width - 16,
        dropShadow: true,
      });
      (style as any).dropShadowBlur = 1;
      (style as any).dropShadowAlpha = 0.15;
      (style as any).dropShadowDistance = 1;

      const t = new PIXI.Text(content.text, style);
      (t as any).anchor?.set?.(0.5, 0);
      t.position.set(0, -slot.height / 2);
      return t;
    }
  }

  private makeBackgroundForFlipped(slot: Slot): any {
    const bottomExtra = 28;

    // Aged paper background for the back
    const bg = new PIXI.Graphics()
      .rect(
        -slot.width / 2,
        -(slot.height + bottomExtra / 2) / 2,
        slot.width,
        slot.height
      )
      .fill(0xf5f3ed); // Slightly cream/aged paper color

    return bg;
  }

  private makeBackContent(slot: Slot): any {
    const bottomExtra = 28;

    // Newspaper clipping style text - return directly without container
    const text = slot.backText || 'Double-click to add text on the back...';

    const t = new PIXI.Text({
      text: text,
      style: {
        fontFamily: 'Georgia, "Times New Roman", Times, serif',
        fontSize: 18,
        fill: 0x2a2a2a,
        wordWrap: true,
        wordWrapWidth: slot.width - 40,
        lineHeight: 24,
        letterSpacing: 0.3,
        align: 'center',
      }
    });

    t.anchor.set(0.5, 0.5);
    // Position at center, offset up slightly to account for bottom border
    t.position.set(0, -(bottomExtra / 2));

    return t;
  }

  private clampView() {
    if (!this.world || !this.app || !this.currentSlot) return;
    const { w, h } = getRendererDims(this.app);
    const s = this.view.scale;

    const left = this.safeInsets.left;
    const right = w - this.safeInsets.right;
    const top = this.safeInsets.top;
    const bottom = h - this.safeInsets.bottom;

    const targetX = this.view.x + this.currentSlot.x * s;
    const targetY = this.view.y + this.currentSlot.y * s;

    let dx = 0, dy = 0;
    if (targetX < left) dx = left - targetX;
    if (targetX > right) dx = right - targetX;
    if (targetY < top) dy = top - targetY;
    if (targetY > bottom) dy = bottom - targetY;

    this.view.x += dx;
    this.view.y += dy;

    this.world.position.set(this.view.x, this.view.y);
    this.world.scale.set(this.view.scale);
  }

  pan(dx: number, dy: number) {
    if (!this.world) return;
    this.view.x += dx; this.view.y += dy;
    this.clampView();
  }

  zoom(factor: number, anchorX: number, anchorY: number) {
    if (!this.world) return;
    const old = this.view.scale;
    const ns = Math.min(3.0, Math.max(0.5, old * factor));
    const wx = (anchorX - this.view.x) / old;
    const wy = (anchorY - this.view.y) / old;
    this.view.scale = ns;
    this.view.x = anchorX - wx * ns;
    this.view.y = anchorY - wy * ns;
    this.clampView();
  }

  resetCamera() {
    if (!this.world || !this.app) return;
    const { w, h } = getRendererDims(this.app);
    this.view = {
      x: w / 2,
      y: h / 2,
      scale: 1
    };
    this.world.position.set(this.view.x, this.view.y);
    this.world.scale.set(this.view.scale);
  }
}