'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LightTableEngine } from '../../lib/pixi/engine';
import {
  useLightTableStore,
  type SlotContent,
} from '../../state/useLightTableStore';

type LightTableAppProps = {
  isAdmin?: boolean;
};

export default function LightTableApp({ isAdmin = false }: LightTableAppProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<LightTableEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    slots,
    currentSlotIndex,
    addSlot,
    nextSlot,
    prevSlot,
    setSlotContent,
    setBackText,
    loupeEnabled,
    toggleLoupe,
    isFlipped,
    toggleFlip,
    loadFromStorage,
    updateSlotPosition,
  } = useLightTableStore();

  // Compute current slot from slots array (don't use store getter - it breaks reactivity)
  const slot = slots[currentSlotIndex] || {
    id: 'default',
    x: 0,
    y: 0,
    width: 520,
    height: 420,
    rotation: 0,
    scale: 1,
    content: undefined,
  };

  const [isEditingBack, setIsEditingBack] = useState(false);
  const [editText, setEditText] = useState('');
  const [uploading, setUploading] = useState(false);
  const isOpeningEditor = useRef(false);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Photo archive state
  type PhotoInfo = {
    filename: string;
    url: string;
    uploadDate: string;
    size: number;
  };
  const [photoArchive, setPhotoArchive] = useState<PhotoInfo[]>([]);
  const [showArchiveDropdown, setShowArchiveDropdown] = useState(false);

  // Load saved slot data on mount (admin only - public pages load data via PublicPageView)
  useEffect(() => {
    if (isAdmin) {
      loadFromStorage();
    }
  }, [isAdmin, loadFromStorage]);

  // Load photo archive
  async function loadPhotoArchive() {
    try {
      const res = await fetch('/api/photos/list', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load photo archive');
      const data = await res.json();
      setPhotoArchive(data.photos || []);
    } catch (error) {
      console.error('Error loading photo archive:', error);
    }
  }

  // Load photo archive on mount and when upload completes
  useEffect(() => {
    loadPhotoArchive();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showArchiveDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is outside the dropdown
      if (!target.closest('.archive-dropdown-container')) {
        setShowArchiveDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showArchiveDropdown]);

  // Select photo from archive
  function selectPhotoFromArchive(photo: PhotoInfo) {
    setSlotContent({
      kind: 'image',
      src: photo.url,
      fit: 'cover',
    });
    setShowArchiveDropdown(false);
  }

  // Delete a single photo
  async function handleDeletePhoto(filename: string, photoUrl: string) {
    if (!confirm(`Delete ${filename}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/photos/delete?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete photo');
      }

      // If the deleted photo is currently displayed, clear it
      if (slot.content?.kind === 'image' && slot.content.src === photoUrl) {
        setSlotContent(undefined);
      }

      // Reload archive
      await loadPhotoArchive();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.message || 'Failed to delete photo');
    }
  }

  // Delete all photos
  async function handleClearAllPhotos() {
    if (!confirm('Are you sure you want to delete ALL uploaded photos? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/photos/delete?all=true', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete photos');
      }

      const data = await res.json();
      alert(data.message || 'All photos deleted');

      // Clear current slot content (both in state and localStorage)
      setSlotContent(undefined);

      // Reload archive (should now be empty)
      await loadPhotoArchive();

      setShowArchiveDropdown(false);
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.message || 'Failed to delete photos');
    }
  }

  async function loadFromPool(pool: 'local' | 'external' | 'any', index?: number) {
    const url = index != null ? `/api/page?pool=${pool}&index=${index}` : `/api/page?pool=${pool}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed fetch');
    const json = await res.json();

    if (json.slot) {
      // update store - the useEffect will sync the engine
      setSlotContent(json.slot as SlotContent);
    } else {
      alert(`No ${pool} images found. Add some to /public/photos.`);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, WEBP, GIF, or AVIF)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      console.log('[Upload] API response:', data);

      // Update store with uploaded image - the useEffect will handle updating the engine
      setSlotContent(data.slot as SlotContent);
      console.log('[Upload] Store updated, useEffect will sync engine');

      // Reload photo archive to include new upload
      await loadPhotoArchive();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || engineRef.current) return;

    const engine = new LightTableEngine({
      onRequestFill: async () => {
        // Prevent multiple rapid fire opens
        if (isOpeningEditor.current) return;

        // Get current state dynamically instead of using closure
        const currentState = useLightTableStore.getState();
        if (currentState.isFlipped && isAdmin) {
          // Double-click on back to edit text (ADMIN ONLY)
          isOpeningEditor.current = true;
          setEditText(currentState.slot.backText || '');
          setIsEditingBack(true);
          setTimeout(() => { isOpeningEditor.current = false; }, 500);
        }
        // Removed aggressive click-to-upload behavior
        // Uploads now only happen when clicking the "Upload Image" button in toolbar
      },
      onSlotPositionChange: (index, x, y) => {
        // Update slot position in store when user drags a frame
        updateSlotPosition(index, x, y);
      },
      safeInsets: { top: 84, left: 12, right: 12, bottom: 56 },
    });
    engineRef.current = engine;

    (async () => {
      await engine.init(container);
      // Get the current slots from store instead of using closure
      const currentState = useLightTableStore.getState();
      await engine.setSlots(currentState.slots, currentState.currentSlotIndex);
      container.style.display = 'block';

      // REMOVED: Auto-load behavior that was causing unwanted photo cycling
      // Photos now only change when user explicitly clicks "Next Photo" or selects from archive

      // WORLD pan/zoom
      const onWheel = (ev: WheelEvent) => {
        const r = container.getBoundingClientRect();
        engine.zoom(ev.deltaY < 0 ? 1.1 : 0.9, ev.clientX - r.left, ev.clientY - r.top);
      };

      let draggingWorld = false, sx = 0, sy = 0;
      const targetCanvas = container.firstChild as HTMLElement | null;

      const onDown = (ev: PointerEvent) => {
        // Don't start world panning if we're editing or if a frame is being dragged
        if (ev.target === targetCanvas && !isEditingBack && !engine.getIsDraggingFrame()) {
          draggingWorld = true;
          sx = ev.clientX;
          sy = ev.clientY;
          (container.style as any).cursor = 'grabbing';
        }
      };

      const onMove = (ev: PointerEvent) => {
        // Stop world dragging if a frame starts being dragged
        if (engine.getIsDraggingFrame() && draggingWorld) {
          draggingWorld = false;
          (container.style as any).cursor = 'default';
        }

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

      // Add double-click to flip on public pages (feels like holding a photo)
      const onDoubleClick = (ev: MouseEvent) => {
        if (!isAdmin && ev.target === targetCanvas) {
          toggleFlip();
        }
      };

      if (!isAdmin) {
        container.addEventListener('dblclick', onDoubleClick);
      }

      return () => {
        container.removeEventListener('wheel', onWheel);
        container.removeEventListener('pointerdown', onDown);
        container.removeEventListener('pointermove', onMove);
        container.removeEventListener('pointerup', onUp);
        if (!isAdmin) {
          container.removeEventListener('dblclick', onDoubleClick);
        }
      };
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep engine in sync with store - render all slots simultaneously
  const slotsKey = slots.map((s, i) => {
    const contentKey = s?.content?.kind === 'image'
      ? `img:${s.content.src}|${s.content.fit ?? ''}`
      : s?.content?.kind === 'text'
      ? `txt:${s.content.text}`
      : 'none';
    return `${i}:${s.x},${s.y},${s.width},${s.height},${contentKey},${s.backText || ''}`;
  }).join('|');

  useEffect(() => {
    engineRef.current?.setSlots(slots, currentSlotIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlotIndex, slotsKey]);

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
    // Check if we're editing a newspaper clipping or a Polaroid back
    const isEditingClipping = slot.content?.kind === 'text';

    if (isEditingClipping) {
      // Update the slot content text directly for newspaper clippings
      setSlotContent({ kind: 'text', text: editText });
    } else {
      // Update back text for Polaroid photos
      setBackText(editText);
    }

    setIsEditingBack(false);

    // Wait a tick for state to update, then force engine re-render
    await new Promise(resolve => setTimeout(resolve, 50));
    const currentState = useLightTableStore.getState();
    if (engineRef.current) {
      await engineRef.current.setSlots(currentState.slots, currentState.currentSlotIndex);
    }
  };

  return (
    <div
      style={{ background: 'transparent', width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Hamburger Menu Button (Mobile Only) */}
      <button
        className="hamburger-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        title="Toggle menu"
        style={{
          position: 'fixed',
          top: isAdmin ? 76 : 20,
          right: 20,
          zIndex: 3000,
          width: 48,
          height: 48,
          display: 'none', // Hidden by default, shown on mobile via media query
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 253, 248, 0.98)',
          border: '1px solid rgba(208, 192, 160, 0.5)',
          borderRadius: 8,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(107, 93, 79, 0.15)',
          fontSize: 24,
          padding: 0,
        }}
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Menu Overlay (when open) */}
      {isMobileMenuOpen && (
        <div
          onClick={() => {
            setIsMobileMenuOpen(false);
            setShowArchiveDropdown(false); // Also close archive dropdown
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 2900,
            display: 'none', // Hidden by default, shown on mobile via media query
          }}
          className="mobile-menu-overlay"
        />
      )}

      {/* Toolbar - Desktop: always visible, Mobile: slide-out drawer */}
      <div
        className={`toolbar-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}
        style={{
          position: 'fixed',
          top: isAdmin ? 140 : 12,
          left: '50%',
          transform: 'translateX(-50%) translateZ(0)',
          zIndex: 2950,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'clamp(4px, 1vw, 8px)',
          willChange: 'transform',
          maxWidth: 'calc(100vw - 24px)',
          justifyContent: 'center',
        }}
      >
        {/* Upload Image (Admin only) */}
        {isAdmin && (
          <button
            className="toolbar-btn"
            onClick={handleUploadClick}
            title="Upload your own image"
            disabled={isFlipped || uploading}
            style={{
              opacity: isFlipped || uploading ? 0.5 : 1,
              background: uploading ? 'rgba(200, 200, 200, 0.3)' : undefined,
            }}
          >
            {uploading ? '⏳ Uploading...' : '📤 Upload Image'}
          </button>
        )}

        {/* Photo Archive Dropdown (Admin only) */}
        {isAdmin && (
          <div className="archive-dropdown-container" style={{ position: 'relative' }}>
            <button
              className="toolbar-btn"
              onClick={() => setShowArchiveDropdown(!showArchiveDropdown)}
              title="View uploaded photos archive"
              disabled={isFlipped}
              style={{
                opacity: isFlipped ? 0.5 : 1,
                background: showArchiveDropdown ? 'rgba(150, 180, 220, 0.3)' : undefined,
              }}
            >
              📂 Archive ({photoArchive.length})
            </button>

            {showArchiveDropdown && photoArchive.length > 0 && (
              <div
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  marginTop: 0,
                  width: 'min(320px, calc(100vw - 32px))',
                  maxHeight: 'min(400px, calc(100vh - 100px))',
                  overflowY: 'auto',
                  background: 'rgba(255, 255, 255, 0.98)',
                  border: '2px solid #c9b89a',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  zIndex: 3000,
                }}
              >
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #e0d0b0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#2a2a2a',
                  }}>
                    Your Uploaded Photos
                  </span>
                  <button
                    onClick={handleClearAllPhotos}
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      border: '1px solid #d0a0a0',
                      borderRadius: 4,
                      background: 'rgba(255, 200, 200, 0.15)',
                      color: '#c44',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 200, 200, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 200, 200, 0.15)';
                    }}
                    title="Delete all uploaded photos"
                  >
                    🗑️ Clear All
                  </button>
                </div>
                {photoArchive.map((photo) => {
                  const date = new Date(photo.uploadDate);
                  const dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const timeStr = date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={photo.url}
                      style={{
                        width: '100%',
                        borderBottom: '1px solid #f0e8d8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(200, 220, 240, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <button
                        onClick={() => selectPhotoFromArchive(photo)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div style={{
                          fontSize: 13,
                          color: '#2a2a2a',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {photo.filename}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: '#666',
                        }}>
                          📅 {dateStr} at {timeStr}
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.filename, photo.url);
                        }}
                        style={{
                          padding: '6px 10px',
                          margin: '0 8px 0 0',
                          fontSize: 12,
                          border: '1px solid #e0a0a0',
                          borderRadius: 4,
                          background: 'rgba(255, 200, 200, 0.1)',
                          color: '#c44',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 200, 200, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 200, 200, 0.1)';
                        }}
                        title={`Delete ${photo.filename}`}
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 1. Cycle Page Image (Admin only) */}
        {isAdmin && (
          <button
            className="toolbar-btn"
            onClick={() => loadFromPool('any')}
            title="Cycle page image"
            disabled={isFlipped}
            style={{ opacity: isFlipped ? 0.5 : 1 }}
          >
            Next Photo
          </button>
        )}

        {/* 1b. Add Text Clipping (Admin only) */}
        {isAdmin && (
          <button
            className="toolbar-btn"
            onClick={() => {
              const defaultText = 'Click to edit...';
              addSlot({ kind: 'text', text: defaultText });
              setIsEditingBack(true);
              setEditText(defaultText);
            }}
            title="Add newspaper clipping text"
          >
            📰 Add Clipping
          </button>
        )}

        {/* 1c. Slot Navigation (Admin only, shown when multiple slots) */}
        {isAdmin && slots.length > 1 && (
          <>
            <button
              className="toolbar-btn"
              onClick={prevSlot}
              title="Previous item"
            >
              ← Prev
            </button>
            <span style={{
              padding: '6px 12px',
              fontSize: 13,
              color: '#5a5a5a',
              fontWeight: 500,
            }}>
              {currentSlotIndex + 1} / {slots.length}
            </span>
            <button
              className="toolbar-btn"
              onClick={nextSlot}
              title="Next item"
            >
              Next →
            </button>
          </>
        )}

        {/* 2. Toggle Loupe */}
        <button
          className="toolbar-btn"
          onClick={toggleLoupe}
          title="Toggle loupe magnification"
          style={{ background: loupeEnabled ? 'rgba(200, 200, 255, 0.2)' : undefined }}
        >
          {loupeEnabled ? '🔍 Loupe ON' : '🔍 Loupe'}
        </button>

        {/* 3. Flip Photo (disabled for newspaper clippings) */}
        <button
          className="toolbar-btn"
          onClick={toggleFlip}
          title={slot.content?.kind === 'text' ? 'Newspaper clippings don\'t flip' : 'Flip photo to see/edit back'}
          disabled={slot.content?.kind === 'text'}
          style={{
            background: isFlipped ? 'rgba(255, 220, 180, 0.3)' : undefined,
            opacity: slot.content?.kind === 'text' ? 0.5 : 1
          }}
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

        {/* 5. Load External Index (Admin only) */}
        {isAdmin && (
          <button
            className="toolbar-btn"
            onClick={() => loadFromPool('external')}
            title="Load external image index"
            disabled={isFlipped}
            style={{ opacity: isFlipped ? 0.5 : 1 }}
          >
            🔀 Load External
          </button>
        )}
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
            width: 'min(480px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            background: 'rgba(255,255,248,0.98)',
            border: '2px solid #c9b89a',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            padding: 'clamp(16px, 4vw, 24px)',
          }}
        >
          <h3 style={{
            margin: '0 0 12px 0',
            fontFamily: 'Georgia, Times, serif',
            fontSize: 18,
            color: '#2a2a2a',
          }}>
            {slot.content?.kind === 'text' ? '📰 Edit Newspaper Clipping' : '✍️ Edit Back of Photo'}
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
        position: 'fixed',
        left: '50%',
        bottom: 12,
        transform: 'translate(-50%,0) translateZ(0)',
        willChange: 'transform',
        zIndex: 1000,
        fontSize: 'clamp(10px, 2vw, 12px)',
        padding: '6px 12px',
        borderRadius: 9999,
        background: 'rgba(255,255,255,0.85)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        maxWidth: 'calc(100vw - 24px)',
        textAlign: 'center',
        lineHeight: 1.3,
      }}>
        {isFlipped
          ? '📝 Double-click frame to edit text • Click "Show Front" to flip back'
          : isAdmin
          ? '🖼️ Scroll to zoom • Drag to pan • Drag frame to reposition • Click "Flip Over" to add notes'
          : '🖼️ Scroll to zoom • Drag to pan • Click "Flip Over" to add notes'}
      </div>
    </div>
  );
}