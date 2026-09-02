'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI, postAPI, putAPI, deleteAPI } from '@/lib/api';

interface AdminPage {
  id: string;
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  is_visible: boolean;
  sections?: any[];
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function PagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<AdminPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<AdminPage | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });

  const [form, setForm] = useState({
    title: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    is_visible: true,
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
    loadPages(token);
  }, [router]);

  async function loadPages(token: string) {
    setLoading(true);
    try {
      const res = await fetchAPI<{ data: AdminPage[] }>('/api/admin/pages', token);
      setPages(res.data || []);
    } catch {
      flash('Failed to load pages', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingPage(null);
    setForm({ title: '', slug: '', meta_title: '', meta_description: '', is_visible: true });
    setShowModal(true);
  }

  function openEdit(p: AdminPage) {
    setEditingPage(p);
    setForm({
      title: p.title,
      slug: p.slug,
      meta_title: p.meta_title || '',
      meta_description: p.meta_description || '',
      is_visible: p.is_visible,
    });
    setShowModal(true);
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug === slugify(prev.title) || prev.slug === '' || editingPage ? slugify(title) : prev.slug,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      meta_title: form.meta_title,
      meta_description: form.meta_description,
      is_visible: form.is_visible,
    };
    try {
      if (editingPage) {
        await putAPI(`/api/admin/pages/${editingPage.id}`, payload, token);
        flash('Page updated', 'success');
      } else {
        await postAPI('/api/admin/pages', payload, token);
        flash('Page created', 'success');
      }
      setShowModal(false);
      loadPages(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to save page', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this page and all its sections?')) return;
    const token = getToken();
    try {
      await deleteAPI(`/api/admin/pages/${id}`, token);
      flash('Page deleted', 'success');
      loadPages(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to delete page', 'error');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">Loading pages...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="admin-page-title">Pages</h2>
          <p className="text-gray-500 text-sm mt-1">Manage site pages and their content.</p>
        </div>
        <button onClick={openCreate} className="admin-btn-primary">
          + Add Page
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
                <th>Title</th>
                <th>Slug</th>
                <th>Visible</th>
                <th>Sections</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No pages found.</td></tr>
              ) : pages.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">/{p.slug}</td>
                  <td className="px-4 py-3">
                    {p.is_visible ? (
                      <span className="text-green-600 text-xs font-medium">Visible</span>
                    ) : (
                      <span className="text-gray-400 text-xs font-medium">Hidden</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.sections?.length || 0}</td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <Link href={`/admin/pages/${p.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Sections</Link>
                    <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="admin-card w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-heading font-semibold text-[var(--color-secondary)] mb-4">{editingPage ? 'Edit Page' : 'Add Page'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="admin-label">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="admin-input"
                  placeholder="Page title"
                />
              </div>
              <div>
                <label className="admin-label">Slug</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="admin-input font-mono"
                  placeholder="my-page"
                />
              </div>
              <div>
                <label className="admin-label">Meta Title</label>
                <input
                  type="text"
                  value={form.meta_title}
                  onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-label">Meta Description</label>
                <textarea
                  value={form.meta_description}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  rows={3}
                  className="admin-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_visible"
                  checked={form.is_visible}
                  onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="is_visible" className="text-sm text-[var(--color-text)]">Visible</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingPage ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
