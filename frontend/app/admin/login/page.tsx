'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { postAPI } from '@/lib/api';

interface LoginResponse {
  token: string;
  user: { id: string; email: string; role: string };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier.trim());
      const payload = isEmail
        ? { email: identifier.trim(), password }
        : { username: identifier.trim(), password };
      const res = await postAPI<LoginResponse>('/api/auth/login', payload);
      localStorage.setItem('admin_token', res.token);
      router.push('/admin');
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-lavender-light)] via-[#faf6fb] to-[var(--color-blush)] px-4 overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/15 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/15 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-[0_10px_40px_-12px_rgba(118,86,127,0.35)] border border-[#ead9ea] p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="admin-page-title text-[26px]">Admin Panel</h1>
            <p className="text-[var(--color-muted)] mt-1.5 text-sm">Sign in to manage your site</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="admin-label mb-1.5">Username or Email</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="admin-input"
                placeholder="admin or admin@example.com"
              />
            </div>
            <div>
              <label className="admin-label mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full admin-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Creative Duo Resin &amp; Co. — Admin Panel
        </p>
      </div>
    </div>
  );
}
