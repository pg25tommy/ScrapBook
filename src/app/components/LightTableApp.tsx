'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LightTableEngine } from '../../lib/pixi/engine';
import {
  useLightTableStore,
  type SlotContent,
} from '../../state/useLightTableStore';

export default function LightTableApp() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<LightTableEngine | null>(null);

  const {
    slot,
    setSlotContent,
    setBackText,
    loupeEnabled,
    toggleLoupe,
    isFlipped,
    toggleFlip,
    loadFromStorage,
  } = useLightTableStore();

  const cycleRef = useRef(0);
  const [isEditingBack, setIsEditingBack] = useState(false);
  const [editText, setEditText] = useState('');
  const isOpeningEditor = useRef(false);

  // Load saved slot data on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  async function loadFromPool(pool: 'local' | 'external' | 'any', index?: number) {
    const url = index != null ? `/api/page?pool=${pool}&index=${index}` : `/api/page?pool=${pool}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed fetch');
    const json = await res.json();

    if (json.slot) {
      // update store for persistence/history
      setSlotContent(json.slot as SlotContent);

      // update PIXI immediately so UI reflects the change
      const engine = engineRef.current;
      if (engine) {
        const nextSlot = { ...slot, content: json.slot as SlotContent };
        await engine.setSlot(nextSlot);
      }
    } else {
      alert(`No ${pool} images found. Add some to /public/photos.`);
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container || engineRef.current) return;

    const engine = new LightTableEngine({
      onRequestFill: async () => {
        // Prevent multiple rapid fire opens
        if (isOpeningEditor.current) return;

        // Get current state dynamically instead of using closure
        const currentState = useLightTableStore.getState();
        if (currentState.isFlipped) {
          // Double-click on back to edit text
          isOpeningEditor.current = true;
          setEditText(currentState.slot.backText || '');
          setIsEditingBack(true);
          setTimeout(() => { isOpeningEditor.current = false; }, 500);
        } else {
          // Click frame to cycle through ANY pool deterministically
          cycleRef.current++;
          try { await loadFromPool('any', cycleRef.current); }
          catch (e) { console.error(e); alert('Could not load image.'); }
        }
      },
      safeInsets: { top: 84, left: 12, right: 12, bottom: 56 },
    });
    engineRef.current = engine;

    (async () => {
      await engine.init(container);
      await engine.setSlot(slot);
      container.style.display = 'block';

      // Auto-load ONE random local photo on first mount if available; fallback to any
      try {
        await loadFromPool('local');
      } catch {
        try { await loadFromPool('any'); } catch (e) { console.error(e); }
      }

      // WORLD pan/zoom
      const onWheel = (ev: WheelEvent) => {
        const r = container.getBoundingClientRect();
        engine.zoom(ev.deltaY < 0 ? 1.1 : 0.9, ev.clientX - r.left, ev.clientY - r.top);
      };

      let draggingWorld = false, sx = 0, sy = 0;
      const targetCanvas = container.firstChild as HTMLElement | null;

      const onDown = (ev: PointerEvent) => {
        if (ev.target === targetCanvas && !isEditingBack) {
          draggingWorld = true;
          sx = ev.clientX;
          sy = ev.clientY;
          (container.style as any).cursor = 'grabbing';
        }
      };

      const onMove = (ev: PointerEvent) => {
        if (draggingWorld) {
          engine.pan(ev.clientX - sx, ev.clientY - sy);
          sx = ev.clientX;
          sy = ev.clientY;
        }
      };

      const onUp = () => {
        draggingWorld = false;
        (container.style as any).cursor = 'default';
      };

      container.addEventListener('wheel', onWheel, { passive: true });
      container.addEventListener('pointerdown', onDown);
      container.addEventListener('pointermove', onMove);
      container.addEventListener('pointerup', onUp);

      return () => {
        container.removeEventListener('wheel', onWheel);
        container.removeEventListener('pointerdown', onDown);
        container.removeEventListener('pointermove', onMove);
        container.removeEventListener('pointerup', onUp);
      };
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep engine in sync with store
  const slotContentKey =
    slot?.content?.kind === 'image'
      ? `img:${slot.content.src}|${slot.content.fit ?? ''}`
      : slot?.content?.kind === 'text'
      ? `txt:${slot.content.text}`
      : 'none';

  useEffect(() => {
    engineRef.current?.setSlot(slot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot.x, slot.y, slot.width, slot.height, slotContentKey, slot.backText]);

  useEffect(() => {
    engineRef.current?.setLoupeEnabled(loupeEnabled);
  }, [loupeEnabled]);

  useEffect(() => {
    engineRef.current?.setFlipped(isFlipped);
  }, [isFlipped]);

  const handleResetCamera = () => {
    engineRef.current?.resetCamera();
  };

  const handleSaveBackText = async () => {
    setBackText(editText);
    setIsEditingBack(false);

    // Wait a tick for state to update, then force engine re-render
    await new Promise(resolve => setTimeout(resolve, 50));
    const currentState = useLightTableStore.getState();
    if (engineRef.current && currentState.isFlipped) {
      await engineRef.current.setSlot(currentState.slot);
    }
  };

  return (
    <div
      style={{ background: 'transparent', width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      {/* Toolbar */}
      <div
        className="toolbar-fixed"
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 1000,
          display: 'flex', gap: 8, transform: 'translateZ(0)', willChange: 'transform'
        }}
      >
        {/* 1. Cycle Page Image */}
        <button
          className="toolbar-btn"
          onClick={() => loadFromPool('any')}
          title="Cycle page image"
          disabled={isFlipped}
          style={{ opacity: isFlipped ? 0.5 : 1 }}
        >
          Next Photo
        </button>

        {/* 2. Toggle Loupe */}
        <button
          className="toolbar-btn"
          onClick={toggleLoupe}
          title="Toggle loupe magnification"
          style={{ background: loupeEnabled ? 'rgba(200, 200, 255, 0.2)' : undefined }}
        >
          {loupeEnabled ? '🔍 Loupe ON' : '🔍 Loupe'}
        </button>

        {/* 3. Flip Photo */}
        <button
          className="toolbar-btn"
          onClick={toggleFlip}
          title="Flip photo to see/edit back"
          style={{ background: isFlipped ? 'rgba(255, 220, 180, 0.3)' : undefined }}
        >
          {isFlipped ? '🔄 Show Front' : '🔄 Flip Over'}
        </button>

        {/* 4. Reset Camera */}
        <button
          className="toolbar-btn"
          onClick={handleResetCamera}
          title="Reset camera view"
        >
          ⊙ Reset View
        </button>

        {/* 5. Load External Index */}
        <button
          className="toolbar-btn"
          onClick={() => loadFromPool('external')}
          title="Load external image index"
          disabled={isFlipped}
          style={{ opacity: isFlipped ? 0.5 : 1 }}
        >
          🔀 Load External
        </button>
      </div>

      {/* Pixi mounts here */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, display: 'none' }} />

      {/* Text editor overlay when editing back */}
      {isEditingBack && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2000,
            width: 480,
            background: 'rgba(255,255,248,0.98)',
            border: '2px solid #c9b89a',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            padding: 24,
          }}
        >
          <h3 style={{
            margin: '0 0 12px 0',
            fontFamily: 'Georgia, Times, serif',
            fontSize: 18,
            color: '#2a2a2a',
          }}>
            ✍️ Edit Back of Photo
          </h3>
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsEditingBack(false);
              if (e.key === 'Enter' && e.ctrlKey) handleSaveBackText();
            }}
            placeholder="Add your note, memory, or newspaper clipping text..."
            style={{
              width: '100%',
              height: 200,
              fontFamily: 'Georgia, "Times New Roman", Times, serif',
              fontSize: 15,
              lineHeight: '20px',
              color: '#2a2a2a',
              padding: 12,
              border: '1px solid #d0c0a0',
              borderRadius: 4,
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
            <button
              className="toolbar-btn"
              onClick={() => setIsEditingBack(false)}
              style={{ background: 'rgba(200, 200, 200, 0.2)' }}
            >
              Cancel (Esc)
            </button>
            <button
              className="toolbar-btn"
              onClick={handleSaveBackText}
              style={{ background: 'rgba(150, 200, 150, 0.2)' }}
            >
              Save (Ctrl+Enter)
            </button>
          </div>
        </div>
      )}

      {/* bottom hint */}
      <div style={{
        position: 'fixed', left: '50%', bottom: 12, transform: 'translate(-50%,0) translateZ(0)',
        willChange: 'transform', zIndex: 1000, fontSize: 12, padding: '6px 12px', borderRadius: 9999,
        background: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', whiteSpace: 'nowrap',
      }}>
        {isFlipped
          ? '📝 Double-click frame to edit text • Click "Show Front" to flip back'
          : '🎞 Click frame to cycle • Scroll to zoom • Drag to pan • Click "Flip Over" to add notes'}
      </div>
    </div>
  );
}