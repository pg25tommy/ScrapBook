'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ScrapbookPage } from '@/lib/db';

type PublicGalleryProps = {
  pages: ScrapbookPage[];
};

export default function PublicGallery({ pages }: PublicGalleryProps) {
  const router = useRouter();

  // Redirect to single page if only one exists
  useEffect(() => {
    if (pages.length === 1) {
      router.push(`/view/${pages[0].slug}`);
    }
  }, [pages, router]);

  if (pages.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f1e8',
          padding: '20px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <h1
            style={{
              fontSize: 'clamp(24px, 5vw, 36px)',
              fontFamily: 'Georgia, serif',
              color: '#2a2a2a',
              marginBottom: 16,
            }}
          >
            No Pages Yet
          </h1>
          <p style={{ fontSize: 'clamp(14px, 3vw, 18px)', color: '#666', lineHeight: 1.6 }}>
            Check back soon for beautiful memories and stories.
          </p>
        </div>
      </div>
    );
  }

  // If there's only one published page, show loading while redirecting
  if (pages.length === 1) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f1e8',
        }}
      >
        <p style={{ fontSize: 18, color: '#666' }}>Loading...</p>
      </div>
    );
  }

  // Show gallery grid if multiple pages
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f1e8',
        padding: 'clamp(20px, 5vw, 60px) clamp(16px, 4vw, 40px)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 'clamp(28px, 6vw, 42px)',
            fontFamily: 'Georgia, serif',
            color: '#2a2a2a',
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          SoftBound by Daniel
        </h1>
        <p
          style={{
            fontSize: 'clamp(14px, 3vw, 18px)',
            color: '#666',
            marginBottom: 'clamp(24px, 4vw, 48px)',
            textAlign: 'center',
          }}
        >
          Browse through the collection
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 'clamp(16px, 3vw, 32px)',
          }}
        >
          {pages.map((page) => (
            <div
              key={page.id}
              onClick={() => router.push(`/view/${page.slug}`)}
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 'clamp(16px, 4vw, 32px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
              }}
            >
              {/* Polaroid-style preview */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '4/3',
                  background: '#e8e4dc',
                  borderRadius: 4,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '8px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {page.slot_data[0]?.content?.kind === 'image' ? (
                  <img
                    src={page.slot_data[0].content.src}
                    alt={page.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 48, color: '#c0b8a8' }}>📷</span>
                )}
              </div>

              <h3
                style={{
                  fontSize: 'clamp(18px, 4vw, 24px)',
                  fontFamily: 'Georgia, serif',
                  color: '#2a2a2a',
                  marginBottom: 8,
                }}
              >
                {page.title}
              </h3>

              <p style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: '#999', margin: 0 }}>
                Updated {new Date(page.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}