'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ScrapbookPage } from '@/lib/db';
import { useLightTableStore } from '@/state/useLightTableStore';
import LightTableApp from './LightTableApp';

type PublicPageViewProps = {
  page: ScrapbookPage;
};

export default function PublicPageView({ page }: PublicPageViewProps) {
  const router = useRouter();
  const { setSlotContent, setBackText } = useLightTableStore();

  // Load the page data into the store on mount
  useEffect(() => {
    if (page.slot_data.content) {
      setSlotContent(page.slot_data.content);
    }
    if (page.slot_data.backText) {
      setBackText(page.slot_data.backText);
    }
  }, [page, setSlotContent, setBackText]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#f5f1e8' }}>
      {/* Header with page title and back button */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          background: 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid #d0c0a0',
          padding: '16px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              color: '#666',
              background: 'transparent',
              border: '1px solid #d0c0a0',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back to Gallery
          </button>

          <h1
            style={{
              fontSize: 24,
              fontFamily: 'Georgia, serif',
              color: '#2a2a2a',
              margin: 0,
            }}
          >
            {page.title}
          </h1>

          <div style={{ width: 100 }} /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Light Table (Read-only view) */}
      <div style={{ paddingTop: 64, width: '100%', height: '100%' }}>
        <LightTableApp isAdmin={false} />
      </div>
    </div>
  );
}