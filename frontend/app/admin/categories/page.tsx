'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI, postAPI, putAPI, deleteAPI, uploadFile } from '@/lib/api';
import type { Category } from '@/lib/types';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_visible: true,
    display_order: 0,
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
    loadCategories(token);
  }, [router]);

  async function loadCategories(token: string) {
    setLoading(true);
    try {
      const res = await fetchAPI<{ data: Category[] }>('/api/admin/categories', token);
      const sorted = [...(res.data || [])].sort((a, b) => a.display_order - b.display_order);
      setCategories(sorted);
    } catch {
      flash('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingCategory(null);
    setForm({ name: '', slug: '', description: '', image_url: '', is_visible: true, display_order: 0 });
    setShowModal(true);
  }

  function openEdit(c: Category) {
    setEditingCategory(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image_url: c.image_url || '',
      is_visible: c.is_visible,
      display_order: c.display_order,
    });
    setShowModal(true);
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === slugify(prev.name) ? slugify(name) : prev.slug,
    }));
  }

  async function handleImageUpload(file: File) {
    const token = getToken();
    const res = await uploadFile('/api/admin/upload', file, 'categories', token);
    setForm((prev) => ({ ...prev, image_url: res.url }));
  }

  async function handleFileChange(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    try {
      await handleImageUpload(fileList[0]);
      flash('Image uploaded', 'success');
    } catch (err: any) {
      flash(err?.message || 'Upload failed', 'error');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      image_url: form.image_url,
      is_visible: form.is_visible,
      display_order: form.display_order,
    };
    try {
      if (editingCategory) {
        await putAPI(`/api/admin/categories/${editingCategory.id}`, payload, token);
        flash('Category updated', 'success');
      } else {
        await postAPI('/api/admin/categories', payload, token);
        flash('Category created', 'success');
      }
      setShowModal(false);
      loadCategories(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to save category', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Products in it may become uncategorized.')) return;
    const token = getToken();
    try {
      await deleteAPI(`/api/admin/categories/${id}`, token);
      flash('Category deleted', 'success');
      loadCategories(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to delete category', 'error');
    }
  }

  async function moveCategory(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const token = getToken();
    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    setCategories(reordered);
    const current = reordered[index];
    const other = reordered[newIndex];
    try {
      await Promise.all([
        putAPI(`/api/admin/categories/${current.id}`, { display_order: index }, token),
        putAPI(`/api/admin/categories/${other.id}`, { display_order: newIndex }, token),
      ]);
      flash('Order updated', 'success');
      loadCategories(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to reorder', 'error');
      loadCategories(token);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading categories...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="admin-page-title">Categories</h2>
          <p className="text-gray-500 text-sm mt-1">Manage product categories.</p>
        </div>
        <button onClick={openCreate} className="admin-btn-primary">
          + Add Category
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="admin-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Visible</th>
                <th>Order</th>
                <th>Products</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No categories found.</td></tr>
              ) : categories.map((c, idx) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.image_url && <img src={c.image_url} alt="" className="w-10 h-10 object-cover rounded-lg" />}
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500">/{c.slug}</td>
                  <td className="px-4 py-3">
                    {c.is_visible ? <span className="text-green-600 text-xs font-medium">Visible</span> : <span className="text-gray-400 text-xs font-medium">Hidden</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveCategory(idx, -1)} disabled={idx === 0} className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-600 text-xs">↑</button>
                      <span className="text-gray-500 text-xs">{c.display_order}</span>
                      <button onClick={() => moveCategory(idx, 1)} disabled={idx === categories.length - 1} className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-600 text-xs">↓</button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{(c as any).product_count ?? '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
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
            <h3 className="text-lg font-heading font-semibold text-[var(--color-secondary)] mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="admin-label">Name</label>
                <input type="text" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} className="admin-input" placeholder="Category name" />
              </div>
              <div>
                <label className="admin-label">Slug</label>
                <input type="text" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="admin-input font-mono" />
              </div>
              <div>
                <label className="admin-label">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label className="admin-label">Image</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files)} className="w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-medium hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer" />
                {form.image_url && <div className="mt-2 flex items-center gap-2">
                  <img src={form.image_url} alt="preview" className="h-16 w-16 object-cover rounded-lg border" />
                  <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono" />
                </div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_visible" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="is_visible" className="text-sm text-gray-700">Visible</label>
                </div>
                <div>
                  <label className="admin-label">Order</label>
                  <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="admin-input" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">Cancel</button>
                <button type="submit" className="admin-btn-primary">{editingCategory ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
