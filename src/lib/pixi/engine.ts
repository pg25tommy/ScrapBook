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

  // Flip animation state (per DESIGN_SPEC.md §9: 150-250ms, ease-out)
  private isAnimatingFlip = false;
  private flipAnimationStart = 0;
  private flipAnimationDuration = 200; // ms
  private targetFlipped = false;

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
      // Force Canvas2D renderer to avoid Firefox WebGL context loss
      forceCanvas: true,
    };

    console.log('[Engine] Forcing Canvas2D renderer due to Firefox WebGL issues');
    console.log('[Engine] Initializing PixiJS with options:', appOpts);

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
    this.world.visible = true;
    (this.world as any).renderable = true;
    (this.world as any).interactiveChildren = true;
    this.app!.stage.addChild(this.world);
    console.log('[Engine] World container created and added to stage');

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

    // Log renderer type
    console.log('[Engine] Renderer type:', this.app.renderer.type);
    console.log('[Engine] Renderer name:', (this.app.renderer as any).rendererLogId || 'unknown');

    // Handle WebGL context loss
    if (canvas instanceof HTMLCanvasElement) {
      canvas.addEventListener('webglcontextlost', (e) => {
        console.error('[Engine] WebGL context lost!', e);
        e.preventDefault();
      });
      canvas.addEventListener('webglcontextrestored', () => {
        console.log('[Engine] WebGL context restored');
        // Force re-render
        if (this.currentSlot) {
          this.setSlot(this.currentSlot);
        }
      });
    }

    // Center the view on initialization
    this.resetCamera();
  }

  async setSlot(slot: Slot) {
    console.log('[Engine] setSlot called with:', slot);
    console.log('[Engine] isFlipped:', this.isFlipped);
    if (!this.world || !this.app) return;
    this.currentSlot = slot;

    this.world.removeChildren();

    const frame = this.buildFrame(slot);
    frame.position.set(slot.x, slot.y);
    this.world.addChild(frame);

    console.log('[Engine] World state after adding frame:', {
      worldX: this.world.x,
      worldY: this.world.y,
      worldScaleX: this.world.scale.x,
      worldScaleY: this.world.scale.y,
      worldVisible: this.world.visible,
      frameX: frame.x,
      frameY: frame.y,
      frameVisible: frame.visible,
      frameWidth: slot.width,
      frameHeight: slot.height,
      appWidth: this.app.screen.width,
      appHeight: this.app.screen.height
    });

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
      console.log('[Engine] Showing front, slot.content:', slot.content);
      if (slot.content) {
        try {
          console.log('[Engine] Calling makeContent...');
          const node = await this.makeContent(slot, slot.content);
          console.log('[Engine] makeContent returned node:', node);
          this.maskIntoFrame(frame, node);
          console.log('[Engine] maskIntoFrame completed');
        } catch (e) {
          console.error('Failed to build slot content:', e);
        }
      } else {
        const plus = new PIXI.Graphics();
        plus.moveTo(0, -18).lineTo(0, 18);
        plus.moveTo(-18, 0).lineTo(18, 0);
        plus.stroke({ width: 3, color: 0x9b8e7a, alpha: 0.9 });
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
    // If already at target state, do nothing
    if (this.isFlipped === flipped && !this.isAnimatingFlip) {
      return;
    }

    // Start flip animation
    this.targetFlipped = flipped;
    this.isAnimatingFlip = true;
    this.flipAnimationStart = performance.now();
    this.animateFlip();
  }

  private animateFlip() {
    if (!this.isAnimatingFlip || !this.world) {
      return;
    }

    const now = performance.now();
    const elapsed = now - this.flipAnimationStart;
    const progress = Math.min(elapsed / this.flipAnimationDuration, 1);

    // Ease-out cubic (per DESIGN_SPEC.md §9)
    const eased = 1 - Math.pow(1 - progress, 3);

    // Scale from 1 to 0 in first half, then 0 to 1 in second half
    let scaleX: number;
    if (eased < 0.5) {
      // First half: scale down to 0
      scaleX = 1 - (eased * 2);
    } else {
      // Second half: scale back up to 1
      scaleX = (eased - 0.5) * 2;

      // Switch content at midpoint (when scaleX = 0)
      if (this.isFlipped !== this.targetFlipped) {
        this.isFlipped = this.targetFlipped;
        if (this.currentSlot) {
          this.setSlot(this.currentSlot);
        }
      }
    }

    // Apply scale to all frame containers
    this.world.children.forEach((child) => {
      if (child instanceof PIXI.Container) {
        child.scale.x = scaleX;
      }
    });

    // Continue animation or finish
    if (progress < 1) {
      requestAnimationFrame(() => this.animateFlip());
    } else {
      this.isAnimatingFlip = false;
      // Ensure final scale is exactly 1
      this.world.children.forEach((child) => {
        if (child instanceof PIXI.Container) {
          child.scale.x = 1;
        }
      });
    }
  }

  private buildFrame(slot: Slot): PIXI.Container {
    const cont = new PIXI.Container();
    (cont as any).sortableChildren = true;

    const border = 16;
    const bottomExtra = 28;
    const frameW = slot.width + border * 2;
    const frameH = slot.height + border * 2 + bottomExtra;

    // Realistic shadow - warm dark tone, not pure black (DESIGN_SPEC.md §6)
    const shadow = new PIXI.Graphics();
    shadow.roundRect(-frameW / 2, -frameH / 2, frameW, frameH, 8);
    shadow.fill({ color: 0x2a231c, alpha: 0.25 }); // Warm dark umber
    shadow.position.set(4, 6);
    const blur = new BlurFilter();
    (blur as any).strength = 6;
    (shadow as any).filters = [blur];
    shadow.zIndex = 1;
    cont.addChild(shadow);

    // Matte white slightly aged, not pure white (DESIGN_SPEC.md §6)
    const matte = new PIXI.Graphics();
    matte.roundRect(-frameW / 2, -frameH / 2, frameW, frameH, 8);
    matte.fill({ color: 0xfbf9f5, alpha: 0.98 }); // Aged matte white
    matte.zIndex = 2;
    cont.addChild(matte);

    const opening = new PIXI.Graphics();
    opening.roundRect(
      -slot.width / 2,
      -(slot.height + bottomExtra / 2) / 2,
      slot.width,
      slot.height,
      2
    );
    opening.fill({ color: 0xffffff, alpha: 1 });
    // In PixiJS 8.x, masks need to be visible and added to the scene
    opening.visible = true;
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
    console.log('[Engine] maskIntoFrame - Applying mask (PixiJS 8.x compatible)');
    // In PixiJS 8.x, set the mask (opening must be visible and in scene)
    (node as any).mask = opening;
    node.zIndex = 4;
    frame.addChild(node as any);
    console.log('[Engine] maskIntoFrame - Mask applied successfully');
  }

  /** Robust loader that works for both same-origin and proxied URLs */
  private async loadImageTexture(url: string): Promise<PIXI.Texture> {
    try {
      // Use PixiJS 8.x Assets API for loading textures
      const texture = await PIXI.Assets.load(url);
      return texture as PIXI.Texture;
    } catch (e) {
      console.warn('Assets.load failed, falling back to blob pipeline:', e);
      // Fallback: fetch as blob and create texture
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`fetch failed ${res.status}`);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = objUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        return PIXI.Texture.from(img);
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    }
  }

  private async makeContent(slot: Slot, content: SlotContent): Promise<any> {
    const bottomExtra = 28;

    if (content.kind === 'image') {
      console.log('[Engine] makeContent loading image from:', content.src);
      try {
        const tex = await this.loadImageTexture(content.src);

        // Check if texture is valid
        if (!tex || !tex.width || !tex.height) {
          console.warn('[Engine] Image texture not available, showing placeholder');
          // Return placeholder instead of throwing
          const errorText = new PIXI.Text({
            text: '📷 Click to add photo',
            style: {
              fontFamily: 'ui-rounded, system-ui',
              fontSize: 16,
              fill: 0x9b8e7a,
            }
          });
          errorText.anchor.set(0.5);
          return errorText;
        }

        console.log('[Engine] Texture loaded:', { width: tex.width, height: tex.height });
        const sp = new PIXI.Sprite(tex);
        sp.anchor.set(0.5);

        const iw = tex.width || sp.texture.width;
        const ih = tex.height || sp.texture.height;
        console.log('[Engine] Image dimensions:', { iw, ih, slotW: slot.width, slotH: slot.height });
        const rw = slot.width / iw;
        const rh = slot.height / ih;
        const scale = (content.fit === 'contain' ? Math.min(rw, rh) : Math.max(rw, rh));
        console.log('[Engine] Scale calculated:', scale, 'fit:', content.fit);
        sp.scale.set(scale);
        sp.y = -(bottomExtra * 0.25);
        return sp;
      } catch (error) {
        console.warn('[Engine] Failed to load image:', error instanceof Error ? error.message : error);
        // Return a placeholder graphic instead of crashing
        const errorText = new PIXI.Text({
          text: '⚠️ Image not found',
          style: {
            fontFamily: 'ui-rounded, system-ui',
            fontSize: 16,
            fill: 0x8b7355, // Warm brown, not grey (DESIGN_SPEC.md §2.3)
          }
        });
        errorText.anchor.set(0.5);
        return errorText;
      }
    } else {
      const style = new PIXI.TextStyle({
        fontFamily: 'ui-rounded, system-ui, -apple-system, Segoe UI',
        fontSize: 18,
        fill: 0x2a2a2a, // Soft black, never pure black (DESIGN_SPEC.md §8)
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