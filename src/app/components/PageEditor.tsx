'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ScrapbookPage } from '@/lib/db';
import { useLightTableStore } from '@/state/useLightTableStore';
import LightTableApp from './LightTableApp';

type PageEditorProps = {
  mode: 'create' | 'edit';
  initialPage?: ScrapbookPage;
};

export default function PageEditor({ mode, initialPage }: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPage?.title || '');
  const [slug, setSlug] = useState(initialPage?.slug || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Get all slots from store (for multi-slot pages)
  const { slots } = useLightTableStore();

  const handleSave = async () => {
    setError('');

    // Validate inputs
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!slug.trim()) {
      setError('Please enter a slug');
      return;
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug must contain only lowercase letters, numbers, and hyphens');
      return;
    }

    setSaving(true);

    try {
      if (mode === 'create') {
        // Create new page
        const res = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug,
            slotData: slots,  // Send all slots
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create page');
        }

        alert('Page created successfully!');
        router.push('/admin');
      } else {
        // Update existing page
        const res = await fetch(`/api/admin/pages/${initialPage!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug,
            slotData: slots,  // Send all slots
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update page');
        }

        alert('Page saved successfully!');
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Discard changes and return to dashboard?')) {
      router.push('/admin');
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (mode === 'create' && !slug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
      setSlug(generatedSlug);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#f5f1e8' }}>
      {/* Editor Header with Save/Cancel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          background: 'rgba(255, 255, 255, 0.98)',
          borderBottom: '1px solid #d0c0a0',
          padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 2vw, 12px)',
          }}
        >
          {/* Page Metadata */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(8px, 2vw, 16px)',
            width: '100%',
          }}>
            <div style={{
              flex: '1 1 auto',
              minWidth: 'min(100%, 200px)',
            }}>
              <input
                type="text"
                placeholder="Page Title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  fontFamily: 'Georgia, serif',
                  border: '1px solid #d0c0a0',
                  borderRadius: 6,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{
              flex: '1 1 auto',
              minWidth: 'min(100%, 200px)',
            }}>
              <input
                type="text"
                placeholder="slug-for-url"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  fontFamily: 'monospace',
                  border: '1px solid #d0c0a0',
                  borderRadius: 6,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              color: '#dc3545',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(4px, 1.5vw, 8px)',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={() => router.push('/admin')}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                color: '#666',
                background: '#fff',
                border: '1px solid #d0c0a0',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              ← Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 500,
                color: '#6b5d4f',
                background: '#fff',
                border: '1px solid #6b5d4f',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              👁️ View Gallery
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                color: '#666',
                background: '#fff',
                border: '1px solid #d0c0a0',
                borderRadius: 6,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 500,
                color: '#fff',
                background: saving ? '#999' : '#6b5d4f',
                border: 'none',
                borderRadius: 6,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Page' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Light Table Editor (with top padding for header) */}
      <div style={{
        position: 'absolute',
        top: 130,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
      }}>
        <LightTableApp isAdmin={true} />
      </div>
    </div>
  );
}