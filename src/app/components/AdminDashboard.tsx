'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { ScrapbookPage } from '@/lib/db';

type AdminDashboardProps = {
  initialPages: ScrapbookPage[];
};

export default function AdminDashboard({ initialPages }: AdminDashboardProps) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [loading, setLoading] = useState<number | null>(null);

  const handleTogglePublish = async (id: number) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error('Failed to toggle publish');

      const { page } = await res.json();

      // Update local state
      setPages(prevPages =>
        prevPages.map(p => (p.id === id ? page : p))
      );
    } catch (error) {
      alert('Failed to update page status');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    setLoading(id);
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      // Remove from local state
      setPages(prevPages => prevPages.filter(p => p.id !== id));
    } catch (error) {
      alert('Failed to delete page');
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f1e8', padding: 'clamp(20px, 4vw, 40px) clamp(12px, 3vw, 20px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 'clamp(20px, 4vw, 32px)',
        }}>
          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 32px)',
            fontFamily: 'Georgia, serif',
            color: '#2a2a2a',
            margin: 0,
            flex: '1 1 auto',
          }}>
            Admin Dashboard
          </h1>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(8px, 2vw, 12px)',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={() => router.push('/')}
              className="toolbar-btn"
              style={{
                padding: '10px 20px',
                background: '#fff',
                color: '#6b5d4f',
                border: '1px solid #6b5d4f',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              👁️ View Gallery
            </button>
            <button
              onClick={() => router.push('/admin/pages/new')}
              className="toolbar-btn"
              style={{
                padding: '10px 20px',
                background: '#6b5d4f',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              + New Page
            </button>
            <button
              onClick={handleLogout}
              className="toolbar-btn"
              style={{
                padding: '10px 20px',
                background: '#fff',
                color: '#666',
                border: '1px solid #d0c0a0',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Pages List */}
        {pages.length === 0 ? (
          <div
            style={{
              background: '#fff',
              padding: 60,
              borderRadius: 12,
              textAlign: 'center',
              color: '#999',
            }}
          >
            <p style={{ fontSize: 18, marginBottom: 16 }}>No pages yet</p>
            <button
              onClick={() => router.push('/admin/pages/new')}
              style={{
                padding: '12px 24px',
                background: '#6b5d4f',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Create Your First Page
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {pages.map(page => (
              <div
                key={page.id}
                style={{
                  background: '#fff',
                  padding: 'clamp(16px, 3vw, 24px)',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 8,
                  }}>
                    <h3 style={{
                      fontSize: 'clamp(16px, 3.5vw, 20px)',
                      fontFamily: 'Georgia, serif',
                      color: '#2a2a2a',
                      margin: 0,
                    }}>
                      {page.title}
                    </h3>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: page.published ? '#d4edda' : '#f8d7da',
                        color: page.published ? '#155724' : '#721c24',
                      }}
                    >
                      {page.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    color: '#666',
                    margin: 0,
                  }}>
                    Slug: /{page.slug}
                  </p>
                  <p style={{
                    fontSize: 'clamp(11px, 2.5vw, 13px)',
                    color: '#999',
                    margin: '4px 0 0 0',
                  }}>
                    Updated: {new Date(page.updated_at).toLocaleDateString()}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'flex-start',
                }}>
                  <button
                    onClick={() => router.push(`/admin/pages/${page.id}`)}
                    disabled={loading === page.id}
                    style={{
                      padding: '8px 16px',
                      background: '#fff',
                      color: '#6b5d4f',
                      border: '1px solid #d0c0a0',
                      borderRadius: 6,
                      cursor: loading === page.id ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTogglePublish(page.id)}
                    disabled={loading === page.id}
                    style={{
                      padding: '8px 16px',
                      background: page.published ? '#f8d7da' : '#d4edda',
                      color: page.published ? '#721c24' : '#155724',
                      border: 'none',
                      borderRadius: 6,
                      cursor: loading === page.id ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                    }}
                  >
                    {loading === page.id
                      ? '...'
                      : page.published
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>
                  <button
                    onClick={() => router.push(`/view/${page.slug}`)}
                    style={{
                      padding: '8px 16px',
                      background: '#fff',
                      color: '#666',
                      border: '1px solid #d0c0a0',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(page.id)}
                    disabled={loading === page.id}
                    style={{
                      padding: '8px 16px',
                      background: '#fff',
                      color: '#dc3545',
                      border: '1px solid #dc3545',
                      borderRadius: 6,
                      cursor: loading === page.id ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}