'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI, postAPI, putAPI, deleteAPI } from '@/lib/api';
import type { Menu, MenuItem } from '@/lib/types';

interface PageRef { id: string; title: string; }
interface CategoryRef { id: string; name: string; }

const ITEM_TYPES = ['page', 'category', 'custom_link'] as const;

export default function MenuItemsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const menuId = params.id;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [pages, setPages] = useState<PageRef[]>([]);
  const [categories, setCategories] = useState<CategoryRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });

  const [form, setForm] = useState({
    label: '',
    type: 'page' as 'page' | 'category' | 'custom_link',
    page_id: '',
    category_id: '',
    url: '',
    parent_id: '',
    display_order: 0,
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
    loadData(token);
  }, [menuId, router]);

  async function loadData(token: string) {
    setLoading(true);
    try {
      const [menuRes, itemsRes, pagesRes, categoriesRes] = await Promise.allSettled([
        fetchAPI<{ data: Menu }>(`/api/admin/menus/${menuId}`, token),
        fetchAPI<{ data: MenuItem[] }>(`/api/admin/menu-items?menuId=${menuId}`, token),
        fetchAPI<{ data: PageRef[] }>('/api/admin/pages', token),
        fetchAPI<{ data: CategoryRef[] }>('/api/admin/categories', token),
      ]);

      if (menuRes.status === 'fulfilled') { const m = menuRes.value.data; if (m) setMenu(m as Menu); }
      if (itemsRes.status === 'fulfilled') {
        const sorted = [...(itemsRes.value.data || [])].sort((a, b) => a.display_order - b.display_order);
        setItems(sorted);
      }
      if (pagesRes.status === 'fulfilled') setPages(pagesRes.value.data || []);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data || []);
    } catch {
      flash('Failed to load menu data', 'error');
    } finally {
      setLoading(false);
    }
  }

  const parentItems = items.filter((it) => it.id !== editingItem?.id);

  function openCreate() {
    setEditingItem(null);
    setForm({ label: '', type: 'page', page_id: '', category_id: '', url: '', parent_id: '', display_order: items.length, is_visible: true });
    setShowModal(true);
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item);
    setForm({
      label: item.label,
      type: item.type,
      page_id: item.page_id || '',
      category_id: item.category_id || '',
      url: item.url || '',
      parent_id: item.parent_id || '',
      display_order: item.display_order,
      is_visible: item.is_visible,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    const base = {
      menu_id: menuId,
      label: form.label,
      type: form.type,
      is_visible: form.is_visible,
      display_order: form.display_order,
      parent_id: form.parent_id || null,
    };
    const payload: any = { ...base };
    if (form.type === 'page') {
      payload.page_id = form.page_id;
      payload.url = null;
    } else if (form.type === 'category') {
      payload.category_id = form.category_id;
      payload.url = null;
    } else {
      payload.url = form.url;
      payload.page_id = null;
      payload.category_id = null;
    }
    try {
      if (editingItem) {
        await putAPI(`/api/admin/menu-items/${editingItem.id}`, payload, token);
        flash('Item updated', 'success');
      } else {
        await postAPI('/api/admin/menu-items', payload, token);
        flash('Item added', 'success');
      }
      setShowModal(false);
      loadData(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to save item', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this menu item?')) return;
    const token = getToken();
    try {
      await deleteAPI(`/api/admin/menu-items/${id}`, token);
      flash('Item deleted', 'success');
      loadData(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to delete item', 'error');
    }
  }

  async function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const token = getToken();
    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    setItems(reordered);
    try {
      await putAPI(
        '/api/admin/menu-items/reorder',
        { items: reordered.map((it, i) => ({ id: it.id, display_order: i })) },
        token
      );
      flash('Order updated', 'success');
      loadData(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to reorder', 'error');
      loadData(token);
    }
  }

  async function toggleVisibility(item: MenuItem) {
    const token = getToken();
    try {
      await putAPI(`/api/admin/menu-items/${item.id}`, { is_visible: !item.is_visible }, token);
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_visible: !item.is_visible } : it)));
      flash(item.is_visible ? 'Item hidden' : 'Item shown', 'success');
    } catch (err: any) {
      flash(err?.message || 'Failed to toggle visibility', 'error');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">Loading menu items...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/menus" className="text-sm text-[var(--color-primary)] hover:text-[var(--color-secondary)] mb-2 inline-block">← Back to Menus</Link>
        <h2 className="admin-page-title">{menu?.name || 'Menu'}</h2>
        <p className="text-[var(--color-muted)] text-sm mt-1">Location: <span className="font-semibold text-[var(--color-secondary)]">{menu?.location}</span> · Use arrows to reorder. Set a parent to create a dropdown submenu.</p>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-[#f2ede8] text-[var(--color-secondary)] border border-[#e3d3ea]' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--color-muted)]">{items.length} items</span>
        <button onClick={openCreate} className="admin-btn-primary">
          + Add Item
        </button>
      </div>

      <div className="admin-card p-0 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-muted)]">No items in this menu yet.</div>
        ) : (
          <ul className="divide-y divide-[#f1e6f0]">
            {items.map((item, idx) => (
              <li key={item.id} className={`px-4 py-4 flex items-center gap-4 hover:bg-[#fbf7fc] transition-colors ${item.parent_id ? 'bg-[#f8f2fa] pl-10' : ''}`}>
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="w-6 h-6 flex items-center justify-center rounded bg-[var(--color-light)] hover:bg-[var(--color-lavender-light)] disabled:opacity-30 text-[var(--color-secondary)] transition-colors">↑</button>
                  <button onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} className="w-6 h-6 flex items-center justify-center rounded bg-[var(--color-light)] hover:bg-[var(--color-lavender-light)] disabled:opacity-30 text-[var(--color-secondary)] transition-colors">↓</button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.parent_id && (
                      <span className="flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M9 17l-3 3-3-3" /></svg>
                        sub
                      </span>
                    )}
                    <span className={`${item.parent_id ? 'text-sm' : 'font-medium text-[var(--color-text)]'} ${item.parent_id ? 'text-[var(--color-secondary)]' : ''}`}>{item.label}</span>
                    <span className="admin-badge bg-[var(--color-lavender-light)] text-[var(--color-secondary)]">{item.type}</span>
                    {!item.is_visible && <span className="text-xs text-[var(--color-muted)]">hidden</span>}
                  </div>
                  <div className="text-sm text-[var(--color-muted)] truncate">
                    {item.type === 'page' && (item.page_title || `Page #${item.page_id}`)}
                    {item.type === 'category' && (item.category_slug || `Category #${item.category_id}`)}
                    {item.type === 'custom_link' && item.url}
                  </div>
                </div>
                <span className="text-xs text-[var(--color-muted)] font-mono">#{item.display_order}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisibility(item)}
                    title={item.is_visible ? 'Hide' : 'Show'}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      item.is_visible
                        ? 'bg-[#f2ede8] text-[var(--color-secondary)] border-[#e3d3ea] hover:bg-[var(--color-light)]'
                        : 'bg-white text-[var(--color-muted)] border-[#e3d3ea] hover:bg-[var(--color-light)]'
                    }`}
                  >
                    {item.is_visible ? 'Visible' : 'Hidden'}
                  </button>
                  <button onClick={() => openEdit(item)} className="px-2 py-1 text-[var(--color-primary)] hover:text-[var(--color-secondary)] text-xs font-medium transition-colors">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-red-600 hover:text-red-800 text-xs font-medium transition-colors">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="admin-card w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-heading font-semibold text-[var(--color-secondary)] mb-4">{editingItem ? 'Edit Item' : 'Add Item'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="admin-label">Label</label>
                <input
                  type="text"
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="admin-input"
                  placeholder="Menu label"
                />
              </div>
              <div>
                <label className="admin-label">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any, page_id: '', category_id: '', url: '' })}
                  className="admin-input"
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {form.type === 'page' && (
                <div>
                  <label className="admin-label">Select Page</label>
                  <select
                    required
                    value={form.page_id}
                    onChange={(e) => setForm({ ...form, page_id: e.target.value })}
                    className="admin-input"
                  >
                    <option value="">Select a page...</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.type === 'category' && (
                <div>
                  <label className="admin-label">Select Category</label>
                  <select
                    required
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="admin-input"
                  >
                    <option value="">Select a category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.type === 'custom_link' && (
                <div>
                  <label className="admin-label">URL</label>
                  <input
                    type="text"
                    required
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="admin-input"
                    placeholder="/about"
                  />
                </div>
              )}
              <div>
                <label className="admin-label">Parent (optional — makes this a dropdown submenu)</label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                  className="admin-input"
                >
                  <option value="">None (top-level item)</option>
                  {parentItems.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--color-muted)]">Pick a parent to nest this item under it as a dropdown.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                    className="admin-input"
                  />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input
                    type="checkbox"
                    id="is_visible"
                    checked={form.is_visible}
                    onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
                    className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <label htmlFor="is_visible" className="text-sm text-[var(--color-text)]">Visible</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
