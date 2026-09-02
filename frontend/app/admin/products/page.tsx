'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI, postAPI, putAPI, deleteAPI, uploadFile } from '@/lib/api';
import type { Product, Category } from '@/lib/types';

interface ProductImage { url: string; alt: string; display_order: number; }

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    currency: 'USD',
    category_id: '',
    is_visible: true,
    is_featured: false,
    display_order: 0,
    images: [] as ProductImage[],
    metadata: '{}',
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
  }, [router]);

  async function loadData(token: string) {
    setLoading(true);
    try {
      const [productsRes, catsRes] = await Promise.allSettled([
        fetchAPI<{ data: Product[] }>('/api/admin/products', token),
        fetchAPI<{ data: Category[] }>('/api/admin/categories', token),
      ]);
      if (productsRes.status === 'fulfilled') {
        const sorted = [...(productsRes.value.data || [])].sort((a, b) => a.display_order - b.display_order);
        setProducts(sorted);
      }
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value.data || []);
    } catch {
      flash('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingProduct(null);
    setForm({
      name: '', slug: '', description: '', short_description: '', price: 0,
      currency: 'USD', category_id: '', is_visible: true, is_featured: false,
      display_order: 0, images: [], metadata: '{}',
    });
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingProduct(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      short_description: p.short_description || '',
      price: p.price,
      currency: p.currency || 'USD',
      category_id: p.category_id || '',
      is_visible: p.is_visible,
      is_featured: p.is_featured,
      display_order: p.display_order,
      images: (p.images || []).map((img) => ({ url: img.url, alt: img.alt || '', display_order: img.display_order })),
      metadata: p.metadata ? JSON.stringify(p.metadata, null, 2) : '{}',
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

  async function handleImagesUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const token = getToken();
    try {
      const newImages: ProductImage[] = [];
      for (const file of Array.from(fileList)) {
        const res = await uploadFile('/api/admin/upload', file, 'products', token);
        newImages.push({ url: res.url, alt: '', display_order: form.images.length + newImages.length });
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
      flash('Images uploaded', 'success');
    } catch (err: any) {
      flash(err?.message || 'Upload failed', 'error');
    }
  }

  function updateImage(index: number, field: keyof ProductImage, value: string) {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = { ...images[index], [field]: value };
      return { ...prev, images };
    });
  }

  function removeImage(index: number) {
    setForm((prev) => {
      const images = [...prev.images];
      images.splice(index, 1);
      return { ...prev, images };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    let metadata: Record<string, any> = {};
    try {
      metadata = form.metadata.trim() ? JSON.parse(form.metadata) : {};
    } catch {
      flash('Metadata must be valid JSON', 'error');
      return;
    }
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      short_description: form.short_description,
      price: Number(form.price),
      currency: form.currency,
      category_id: form.category_id || null,
      is_visible: form.is_visible,
      is_featured: form.is_featured,
      display_order: form.display_order,
      images: form.images,
      metadata,
    };
    try {
      if (editingProduct) {
        await putAPI(`/api/admin/products/${editingProduct.id}`, payload, token);
        flash('Product updated', 'success');
      } else {
        await postAPI('/api/admin/products', payload, token);
        flash('Product created', 'success');
      }
      setShowModal(false);
      loadData(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to save product', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    const token = getToken();
    try {
      await deleteAPI(`/api/admin/products/${id}`, token);
      flash('Product deleted', 'success');
      loadData(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to delete product', 'error');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">Loading products...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="admin-page-title">Products</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your product catalog.</p>
        </div>
        <button onClick={openCreate} className="admin-btn-primary">
          + Add Product
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
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Visible</th>
                <th>Featured</th>
                <th>Order</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No products found.</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] && <img src={p.images[0].url} alt="" className="w-10 h-10 object-cover rounded-lg" />}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{p.name}</div>
                        <div className="text-xs text-gray-400 font-mono">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.category_name || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.currency || 'USD'} {p.price}</td>
                  <td className="px-4 py-3">{p.is_visible ? <span className="text-green-600 text-xs font-medium">Visible</span> : <span className="text-gray-400 text-xs font-medium">Hidden</span>}</td>
                  <td className="px-4 py-3">{p.is_featured ? <span className="text-amber-600">★</span> : <span className="text-gray-300">☆</span>}</td>
                  <td className="px-4 py-3 text-gray-500">{p.display_order}</td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
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
          <div className="admin-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-heading font-semibold text-[var(--color-secondary)] mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="admin-label">Name</label>
                <input type="text" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} className="admin-input" placeholder="Product name" />
              </div>
              <div>
                <label className="admin-label">Slug</label>
                <input type="text" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono" />
              </div>
              <div>
                <label className="admin-label">Short Description</label>
                <input type="text" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label className="admin-label">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Price</label>
                  <input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="admin-input" />
                </div>
                <div>
                  <label className="admin-label">Currency</label>
                  <input type="text" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} className="admin-input" />
                </div>
              </div>
              <div>
                <label className="admin-label">Category</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="admin-input">
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Images</label>
                <input type="file" accept="image/*" multiple onChange={(e) => handleImagesUpload(e.target.files)} className="w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-medium hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer" />
                {form.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-2 space-y-2">
                        <div className="relative">
                          <img src={img.url} alt="" className="w-full h-24 object-cover rounded" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded hover:bg-red-700">✕</button>
                        </div>
                        <input type="text" value={img.alt} onChange={(e) => updateImage(idx, 'alt', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Alt text" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="admin-label">Metadata (JSON)</label>
                <textarea rows={4} value={form.metadata} onChange={(e) => setForm({ ...form, metadata: e.target.value })} className="admin-input font-mono" placeholder='{"material": "resin"}' />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_visible" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="is_visible" className="text-sm text-gray-700">Visible</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_featured" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="is_featured" className="text-sm text-gray-700">Featured</label>
                </div>
              </div>
              <div>
                <label className="admin-label">Order</label>
                <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="admin-input" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">Cancel</button>
                <button type="submit" className="admin-btn-primary">{editingProduct ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
