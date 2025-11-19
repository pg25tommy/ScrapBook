'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username or password');
        setLoading(false);
      } else {
        // Redirect to admin dashboard or return URL
        const callbackUrl = searchParams.get('callbackUrl') || '/admin';
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred during login');
      setLoading(false);
    }
  };

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
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          padding: 'clamp(24px, 5vw, 40px)',
          background: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(20px, 4vw, 24px)',
            fontFamily: 'Georgia, serif',
            marginBottom: 8,
            color: '#2a2a2a',
            textAlign: 'center',
          }}
        >
          Admin Login
        </h1>
        <p
          style={{
            fontSize: 'clamp(12px, 2.5vw, 14px)',
            color: '#666',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          SoftBound by Daniel
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: 500,
                color: '#2a2a2a',
              }}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 'clamp(14px, 3vw, 16px)',
                border: '1px solid #d0c0a0',
                borderRadius: 6,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#9b8e7a')}
              onBlur={(e) => (e.target.style.borderColor = '#d0c0a0')}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: 500,
                color: '#2a2a2a',
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 'clamp(14px, 3vw, 16px)',
                border: '1px solid #d0c0a0',
                borderRadius: 6,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#9b8e7a')}
              onBlur={(e) => (e.target.style.borderColor = '#d0c0a0')}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                marginBottom: 16,
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: 6,
                color: '#c00',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: 14,
              fontWeight: 500,
              color: '#fff',
              background: loading ? '#999' : '#6b5d4f',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.background = '#5a4d3f';
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.background = '#6b5d4f';
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}