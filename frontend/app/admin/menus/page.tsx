'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI, postAPI, putAPI, deleteAPI } from '@/lib/api';
import type { Menu } from '@/lib/types';

const LOCATIONS = ['main', 'footer', 'sidebar', 'mobile'];

export default function MenusPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });
  const [form, setForm] = useState({ name: '', location: 'main' });

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
    loadMenus(token);
  }, [router]);

  async function loadMenus(token: string) {
    setLoading(true);
    try {
      const res = await fetchAPI<{ data: Menu[] }>('/api/admin/menus', token);
      setMenus(res.data || []);
    } catch {
      flash('Failed to load menus', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    try {
      if (editingMenu) {
        await putAPI(`/api/admin/menus/${editingMenu.id}`, form, token);
        flash('Menu updated', 'success');
      } else {
        await postAPI('/api/admin/menus', form, token);
        flash('Menu created', 'success');
      }
      setShowModal(false);
      setEditingMenu(null);
      setForm({ name: '', location: 'main' });
      loadMenus(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to save menu', 'error');
    }
  }

  function openCreate() {
    setEditingMenu(null);
    setForm({ name: '', location: 'main' });
    setShowModal(true);
  }

  function openEdit(menu: Menu) {
    setEditingMenu(menu);
    setForm({ name: menu.name, location: menu.location });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this menu and all its items?')) return;
    const token = getToken();
    try {
      await deleteAPI(`/api/admin/menus/${id}`, token);
      flash('Menu deleted', 'success');
      loadMenus(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to delete menu', 'error');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">Loading menus...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="admin-page-title">Menus</h2>
          <p className="text-gray-500 text-sm mt-1">Manage navigation menus and their items.</p>
        </div>
        <button onClick={openCreate} className="admin-btn-primary">
          + Add Menu
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menus.length === 0 ? (
          <div className="col-span-full admin-card p-8 text-center text-[var(--color-muted)]">No menus found.</div>
        ) : menus.map((menu) => (
          <div key={menu.id} className="admin-card p-5 hover:-translate-y-1 hover:shadow-[0_14px_30px_-12px_rgba(118,86,127,0.35)] transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-heading font-semibold text-lg text-[var(--color-secondary)]">{menu.name}</h3>
                <span className="admin-badge bg-[var(--color-light)] text-[var(--color-secondary)] mt-1">{menu.location}</span>
              </div>
              <span className="text-sm text-[var(--color-muted)]">{menu.items?.length || 0} items</span>
            </div>
            <div className="flex gap-2 mt-4">
              <Link
                href={`/admin/menus/${menu.id}`}
                className="flex-1 text-center px-3 py-2 bg-[var(--color-lavender-light)] text-[var(--color-secondary)] text-sm font-semibold rounded-xl hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200"
              >
                Manage Items
              </Link>
              <button
                onClick={() => openEdit(menu)}
                className="admin-btn-secondary"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(menu.id)}
                className="admin-btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="admin-card w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-heading font-semibold text-[var(--color-secondary)] mb-4">{editingMenu ? 'Edit Menu' : 'Create Menu'}</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="admin-label">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. Main Menu"
                />
              </div>
              <div>
                <label className="admin-label">Location</label>
                <select
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="admin-input"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--color-muted)]">Location determines where this menu appears. <span className="font-semibold">main</span> = navbar, <span className="font-semibold">footer</span> = footer.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingMenu(null); }} className="admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingMenu ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
