'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI, postAPI, putAPI, deleteAPI } from '@/lib/api';
import type { DesignToken } from '@/lib/types';

const TOKEN_TYPES = ['color', 'font'];

export default function DesignTokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<DesignToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingToken, setEditingToken] = useState<DesignToken | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });

  const [form, setForm] = useState({
    type: 'color',
    key: '',
    value: '',
    description: '',
    is_active: true,
  });

  function getToken(): string {
    return localStorage.getItem('admin_token') || '';
  }

  function flash(text: string, type: 'success' | 'error') {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  }

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/admin/login'); return; }
    loadTokens(token);
  }, [router]);

  async function loadTokens(token: string) {
    setLoading(true);
    try {
      const res = await fetchAPI<{ data: DesignToken[] }>('/api/admin/design-tokens', token);
      setTokens(res.data || []);
    } catch {
      flash('Failed to load tokens', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingToken(null);
    setForm({ type: 'color', key: '', value: '', description: '', is_active: true });
    setShowModal(true);
  }

  function openEdit(t: DesignToken) {
    setEditingToken(t);
    setForm({ type: t.type, key: t.key, value: t.value, description: t.description || '', is_active: t.is_active });
    setShowModal(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    try {
      if (editingToken) {
        await putAPI(`/api/admin/design-tokens/${editingToken.id}`, form, token);
        flash('Token updated', 'success');
      } else {
        await postAPI('/api/admin/design-tokens', form, token);
        flash('Token created', 'success');
      }
      setShowModal(false);
      loadTokens(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to save token', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this token?')) return;
    const token = getToken();
    try {
      await deleteAPI(`/api/admin/design-tokens/${id}`, token);
      flash('Token deleted', 'success');
      loadTokens(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to delete', 'error');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">Loading design tokens...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="admin-page-title">Design Tokens</h2>
          <p className="text-gray-500 text-sm mt-1">Manage colors, fonts, and design system values.</p>
        </div>
        <button onClick={openCreate} className="admin-btn-primary">
          + Add Token
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="admin-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Key</th>
                <th>Value</th>
                <th>Description</th>
                <th>Active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No tokens found.</td></tr>
              ) : tokens.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${t.type === 'color' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-800">{t.key}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.type === 'color' && (
                        <span className="w-6 h-6 rounded border border-gray-200 inline-block" style={{ backgroundColor: t.value }} />
                      )}
                      {t.type === 'font' ? (
                        <span style={{ fontFamily: `'${t.value}', sans-serif` }}>{t.value}</span>
                      ) : (
                        <span className="font-mono text-gray-700">{t.value}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.description || '—'}</td>
                  <td className="px-4 py-3">
                    {t.is_active ? (
                      <span className="text-green-600 text-xs font-medium">Active</span>
                    ) : (
                      <span className="text-gray-400 text-xs font-medium">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(t)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="admin-card w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-heading font-semibold text-[var(--color-secondary)] mb-4">{editingToken ? 'Edit Token' : 'Add Token'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="admin-label">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="admin-input"
                >
                  {TOKEN_TYPES.map((tt) => (
                    <option key={tt} value={tt}>{tt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Key</label>
                <input
                  type="text"
                  required
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. primary, heading"
                />
              </div>
              <div>
                <label className="admin-label">Value</label>
                {form.type === 'color' ? (
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.value || '#000000'}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      className="w-12 h-10 border border-[#e3d3ea] rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      className="admin-input font-mono"
                      placeholder="#000000"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="admin-input"
                    placeholder="e.g. Inter, Playfair Display"
                  />
                )}
              </div>
              <div>
                <label className="admin-label">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="admin-input"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="is_active" className="text-sm text-[var(--color-text)]">Active</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingToken ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
