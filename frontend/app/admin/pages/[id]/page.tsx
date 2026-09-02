'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI, postAPI, putAPI, deleteAPI, uploadFile } from '@/lib/api';
import type { PageSection } from '@/lib/types';

interface AdminPage {
  id: string;
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  is_visible: boolean;
}

interface CategoryRef { id: string; name: string; }

const SECTION_TYPES = [
  'hero', 'features', 'text_block', 'image_grid', 'product_grid',
  'category_grid', 'faq', 'reviews', 'gallery', 'custom_order', 'custom_html',
];

const INPUT_CLS = 'admin-input';
const FILE_CLS = 'w-full text-sm text-[var(--color-muted)] file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-[var(--color-lavender-light)] file:text-[var(--color-secondary)] file:font-medium hover:file:bg-[var(--color-blush)] file:cursor-pointer cursor-pointer';

export default function PageSectionsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pageId = params.id;

  const [page, setPage] = useState<AdminPage | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [categories, setCategories] = useState<CategoryRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });
  const [selectedType, setSelectedType] = useState('hero');

  const [form, setForm] = useState<Record<string, any>>({
    section_type: 'hero',
    title: '',
    subtitle: '',
    is_visible: true,
    content: {},
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
  }, [pageId, router]);

  async function loadData(token: string) {
    setLoading(true);
    try {
      const [pageRes, sectionsRes, catsRes] = await Promise.allSettled([
        fetchAPI<{ data: AdminPage }>(`/api/admin/pages/${pageId}`, token),
        fetchAPI<{ data: PageSection[] }>(`/api/admin/page-sections?pageId=${pageId}`, token),
        fetchAPI<{ data: CategoryRef[] }>('/api/admin/categories', token),
      ]);
      if (pageRes.status === 'fulfilled') setPage(pageRes.value.data);
      if (sectionsRes.status === 'fulfilled') {
        const sorted = [...(sectionsRes.value.data || [])].sort((a, b) => a.display_order - b.display_order);
        setSections(sorted);
      }
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value.data || []);
    } catch {
      flash('Failed to load page sections', 'error');
    } finally {
      setLoading(false);
    }
  }

  function emptyContentForType(type: string): Record<string, any> {
    switch (type) {
      case 'hero':
        return { headline: '', subtext: '', cta_text: '', cta_link: '', secondary_cta_text: '', secondary_cta_link: '', image: '' };
      case 'features':
        return { items: [{ icon: '✨', title: '', description: '' }] };
      case 'text_block':
        return { html: '<p></p>' };
      case 'image_grid':
        return { images: [{ url: '', alt: '', caption: '' }] };
      case 'product_grid':
        return { show_featured: true, category_id: '', limit: 4 };
      case 'category_grid':
        return { show_all: true };
      case 'faq':
        return { items: [{ question: '', answer: '' }] };
      case 'reviews':
        return { items: [{ quote: '', author: '', rating: 5 }] };
      case 'gallery':
        return { images: [{ url: '', caption: '' }] };
      case 'custom_order':
        return { headline: '', description: '', cta: { text: '', link: '' }, steps: [{ title: '', description: '' }] };
      case 'custom_html':
        return { html: '' };
      default:
        return {};
    }
  }

  function openCreate() {
    setEditingSection(null);
    setSelectedType('hero');
    setForm({ section_type: 'hero', title: '', subtitle: '', is_visible: true, content: emptyContentForType('hero') });
    setShowModal(true);
  }

  function openEdit(sec: PageSection) {
    setEditingSection(sec);
    setSelectedType(sec.section_type);
    let content: Record<string, any> = {};
    if (typeof sec.content === 'string') {
      try { content = JSON.parse(sec.content); } catch { content = {}; }
    } else if (sec.content && typeof sec.content === 'object') {
      content = sec.content;
    }
    setForm({
      section_type: sec.section_type,
      title: sec.title || '',
      subtitle: sec.subtitle || '',
      is_visible: sec.is_visible,
      content: { ...content },
    });
    setShowModal(true);
  }

  function handleTypeChange(type: string) {
    setSelectedType(type);
    setForm((prev) => ({ ...prev, section_type: type, content: emptyContentForType(type) }));
  }

  async function handleImageUpload(file: File): Promise<string> {
    const token = getToken();
    const res = await uploadFile('/api/admin/upload', file, 'sections', token);
    return res.url;
  }

  async function handleFileChange(field: string, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    try {
      const url = await handleImageUpload(file);
      setForm((prev) => ({
        ...prev,
        content: { ...prev.content, [field]: url },
      }));
      flash('Image uploaded', 'success');
    } catch (err: any) {
      flash(err?.message || 'Upload failed', 'error');
    }
  }

  async function handleMultiImageUpload(field: string, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const token = getToken();
    try {
      const existing: any[] = Array.isArray(form.content[field]) ? form.content[field] : [];
      const newItems: any[] = [];
      const arr = Array.from(fileList);
      for (const file of arr) {
        const res = await uploadFile('/api/admin/upload', file, 'sections', token);
        newItems.push({ url: res.url, alt: '', caption: '' });
      }
      setForm((prev) => ({
        ...prev,
        content: { ...prev.content, [field]: [...existing, ...newItems] },
      }));
    } catch (err: any) {
      flash(err?.message || 'Upload failed', 'error');
    }
  }

  function updateArrayItem(field: string, index: number, itemKey: string, value: any) {
    setForm((prev) => {
      const items = Array.isArray(prev.content[field]) ? [...prev.content[field]] : [];
      items[index] = { ...items[index], [itemKey]: value };
      return { ...prev, content: { ...prev.content, [field]: items } };
    });
  }

  function addArrayItem(field: string, emptyItem: Record<string, any>) {
    setForm((prev) => {
      const items = Array.isArray(prev.content[field]) ? [...prev.content[field]] : [];
      items.push(emptyItem);
      return { ...prev, content: { ...prev.content, [field]: items } };
    });
  }

  function removeArrayItem(field: string, index: number) {
    setForm((prev) => {
      const items = Array.isArray(prev.content[field]) ? [...prev.content[field]] : [];
      items.splice(index, 1);
      return { ...prev, content: { ...prev.content, [field]: items } };
    });
  }

  function renderTypeFields() {
    const c = form.content;

    switch (selectedType) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
              <input type="text" value={c.headline || ''} onChange={(e) => setForm({ ...form, content: { ...c, headline: e.target.value } })} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtext</label>
              <textarea rows={2} value={c.subtext || ''} onChange={(e) => setForm({ ...form, content: { ...c, subtext: e.target.value } })} className={INPUT_CLS} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text</label>
                <input type="text" value={c.cta_text || ''} onChange={(e) => setForm({ ...form, content: { ...c, cta_text: e.target.value } })} className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA Link</label>
                <input type="text" value={c.cta_link || ''} onChange={(e) => setForm({ ...form, content: { ...c, cta_link: e.target.value } })} className={INPUT_CLS} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary CTA Text</label>
                <input type="text" value={c.secondary_cta_text || ''} onChange={(e) => setForm({ ...form, content: { ...c, secondary_cta_text: e.target.value } })} className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary CTA Link</label>
                <input type="text" value={c.secondary_cta_link || ''} onChange={(e) => setForm({ ...form, content: { ...c, secondary_cta_link: e.target.value } })} className={INPUT_CLS} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange('image', e.target.files)} className={FILE_CLS} />
              {c.image && <img src={c.image} alt="preview" className="mt-2 h-24 w-32 object-cover rounded-lg border" />}
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            {(c.items || []).map((item: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Feature {idx + 1}</span>
                  <button type="button" onClick={() => removeArrayItem('items', idx)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                </div>
                <input type="text" value={item.icon || ''} onChange={(e) => updateArrayItem('items', idx, 'icon', e.target.value)} className={INPUT_CLS} placeholder="Icon (emoji or text)" />
                <input type="text" value={item.title || ''} onChange={(e) => updateArrayItem('items', idx, 'title', e.target.value)} className={INPUT_CLS} placeholder="Title" />
                <textarea rows={2} value={item.description || ''} onChange={(e) => updateArrayItem('items', idx, 'description', e.target.value)} className={INPUT_CLS} placeholder="Description" />
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('items', { icon: '✨', title: '', description: '' })} className="px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
              + Add Feature
            </button>
          </div>
        );

      case 'text_block':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
            <textarea rows={6} value={c.html || ''} onChange={(e) => setForm({ ...form, content: { ...c, html: e.target.value } })} className={`${INPUT_CLS} font-mono text-xs`} placeholder="<p>Enter HTML here</p>" />
          </div>
        );

      case 'image_grid':
        return (
          <div className="space-y-4">
            <input type="file" accept="image/*" multiple onChange={(e) => handleMultiImageUpload('images', e.target.files)} className={FILE_CLS} />
            {(c.images || []).map((img: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center gap-3">
                  {img.url && <img src={img.url} alt="preview" className="h-16 w-16 object-cover rounded" />}
                  <button type="button" onClick={() => removeArrayItem('images', idx)} className="ml-auto text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                </div>
                <input type="text" value={img.url || ''} onChange={(e) => updateArrayItem('images', idx, 'url', e.target.value)} className={INPUT_CLS} placeholder="Image URL" />
                <input type="text" value={img.alt || ''} onChange={(e) => updateArrayItem('images', idx, 'alt', e.target.value)} className={INPUT_CLS} placeholder="Alt text" />
                <input type="text" value={img.caption || ''} onChange={(e) => updateArrayItem('images', idx, 'caption', e.target.value)} className={INPUT_CLS} placeholder="Caption" />
              </div>
            ))}
          </div>
        );

      case 'product_grid':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!c.show_featured} onChange={(e) => setForm({ ...form, content: { ...c, show_featured: e.target.checked } })} className="rounded border-gray-300 text-indigo-600" />
              <label className="text-sm text-gray-700">Show featured only</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={c.category_id || ''} onChange={(e) => setForm({ ...form, content: { ...c, category_id: e.target.value } })} className={INPUT_CLS}>
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
              <input type="number" value={c.limit || ''} onChange={(e) => setForm({ ...form, content: { ...c, limit: Number(e.target.value) } })} className={INPUT_CLS} />
            </div>
          </div>
        );

      case 'category_grid':
        return (
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={!!c.show_all} onChange={(e) => setForm({ ...form, content: { ...c, show_all: e.target.checked } })} className="rounded border-gray-300 text-indigo-600" />
            <label className="text-sm text-gray-700">Show all categories</label>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-4">
            {(c.items || []).map((item: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Q&A {idx + 1}</span>
                  <button type="button" onClick={() => removeArrayItem('items', idx)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                </div>
                <input type="text" value={item.question || ''} onChange={(e) => updateArrayItem('items', idx, 'question', e.target.value)} className={INPUT_CLS} placeholder="Question" />
                <textarea rows={2} value={item.answer || ''} onChange={(e) => updateArrayItem('items', idx, 'answer', e.target.value)} className={INPUT_CLS} placeholder="Answer" />
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('items', { question: '', answer: '' })} className="px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">+ Add Q&A</button>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-4">
            {(c.items || []).map((item: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Review {idx + 1}</span>
                  <button type="button" onClick={() => removeArrayItem('items', idx)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                </div>
                <textarea rows={2} value={item.quote || ''} onChange={(e) => updateArrayItem('items', idx, 'quote', e.target.value)} className={INPUT_CLS} placeholder="Quote" />
                <input type="text" value={item.author || ''} onChange={(e) => updateArrayItem('items', idx, 'author', e.target.value)} className={INPUT_CLS} placeholder="Author" />
                <input type="number" min={1} max={5} value={item.rating || 5} onChange={(e) => updateArrayItem('items', idx, 'rating', Number(e.target.value))} className={INPUT_CLS} placeholder="Rating (1-5)" />
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('items', { quote: '', author: '', rating: 5 })} className="px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">+ Add Review</button>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-4">
            <input type="file" accept="image/*" multiple onChange={(e) => handleMultiImageUpload('images', e.target.files)} className={FILE_CLS} />
            {(c.images || []).map((img: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center gap-3">
                  {img.url && <img src={img.url} alt="preview" className="h-16 w-16 object-cover rounded" />}
                  <button type="button" onClick={() => removeArrayItem('images', idx)} className="ml-auto text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                </div>
                <input type="text" value={img.url || ''} onChange={(e) => updateArrayItem('images', idx, 'url', e.target.value)} className={INPUT_CLS} placeholder="Image URL" />
                <input type="text" value={img.caption || ''} onChange={(e) => updateArrayItem('images', idx, 'caption', e.target.value)} className={INPUT_CLS} placeholder="Caption" />
              </div>
            ))}
          </div>
        );

      case 'custom_order':
        return (
          <div className="space-y-4">
            <input type="text" value={c.headline || ''} onChange={(e) => setForm({ ...form, content: { ...c, headline: e.target.value } })} className={INPUT_CLS} placeholder="Headline" />
            <textarea rows={2} value={c.description || ''} onChange={(e) => setForm({ ...form, content: { ...c, description: e.target.value } })} className={INPUT_CLS} placeholder="Description" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={c.cta?.text || ''} onChange={(e) => setForm({ ...form, content: { ...c, cta: { ...(c.cta || {}), text: e.target.value } } })} className={INPUT_CLS} placeholder="CTA Text" />
              <input type="text" value={c.cta?.link || ''} onChange={(e) => setForm({ ...form, content: { ...c, cta: { ...(c.cta || {}), link: e.target.value } } })} className={INPUT_CLS} placeholder="CTA Link" />
            </div>
            {(c.steps || []).map((step: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Step {idx + 1}</span>
                  <button type="button" onClick={() => removeArrayItem('steps', idx)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                </div>
                <input type="text" value={step.title || ''} onChange={(e) => updateArrayItem('steps', idx, 'title', e.target.value)} className={INPUT_CLS} placeholder="Step title" />
                <textarea rows={2} value={step.description || ''} onChange={(e) => updateArrayItem('steps', idx, 'description', e.target.value)} className={INPUT_CLS} placeholder="Step description" />
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('steps', { title: '', description: '' })} className="px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">+ Add Step</button>
          </div>
        );

      case 'custom_html':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
            <textarea rows={6} value={c.html || ''} onChange={(e) => setForm({ ...form, content: { ...c, html: e.target.value } })} className={`${INPUT_CLS} font-mono text-xs`} placeholder="<div>Custom HTML</div>" />
          </div>
        );

      default:
        return null;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    const payload = {
      page_id: pageId,
      section_type: form.section_type,
      title: form.title,
      subtitle: form.subtitle,
      is_visible: form.is_visible,
      content: JSON.stringify(form.content),
    };
    try {
      if (editingSection) {
        await putAPI(`/api/admin/page-sections/${editingSection.id}`, payload, token);
        flash('Section updated', 'success');
      } else {
        await postAPI('/api/admin/page-sections', payload, token);
        flash('Section added', 'success');
      }
      setShowModal(false);
      loadData(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to save section', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this section?')) return;
    const token = getToken();
    try {
      await deleteAPI(`/api/admin/page-sections/${id}`, token);
      flash('Section deleted', 'success');
      loadData(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to delete section', 'error');
    }
  }

  async function toggleVisibility(sec: PageSection) {
    const token = getToken();
    try {
      await putAPI(`/api/admin/page-sections/${sec.id}`, { is_visible: !sec.is_visible }, token);
      loadData(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to update visibility', 'error');
    }
  }

  async function moveSection(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const token = getToken();
    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    setSections(reordered);
    const current = reordered[index];
    const other = reordered[newIndex];
    try {
      await Promise.all([
        putAPI(`/api/admin/page-sections/${current.id}`, { display_order: index }, token),
        putAPI(`/api/admin/page-sections/${other.id}`, { display_order: newIndex }, token),
      ]);
      flash('Order updated', 'success');
      loadData(token);
    } catch (err: any) {
      flash(err?.message || 'Failed to reorder', 'error');
      loadData(token);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">Loading sections...</div>;
  }

  return (
    <div>

      <div className="mb-6">
        <Link href="/admin/pages" className="text-sm text-[var(--color-primary)] hover:text-[var(--color-secondary)] mb-2 inline-block">← Back to Pages</Link>
        <h2 className="admin-page-title">{page?.title || 'Page'}</h2>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Slug: /{page?.slug} · {page?.is_visible ? 'Visible' : 'Hidden'} · {sections.length} sections
        </p>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-[#f2ede8] text-[var(--color-secondary)] border border-[#e3d3ea]' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--color-muted)]">{sections.length} sections</span>
        <button onClick={() => { setEditingSection(null); setSelectedType('hero'); setForm({ section_type: 'hero', title: '', subtitle: '', is_visible: true, content: emptyContentForType('hero') }); setShowModal(true); }} className="admin-btn-primary">
          + Add Section
        </button>
      </div>

      <div className="admin-card p-0 overflow-hidden">
        {sections.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-muted)]">No sections in this page yet.</div>
        ) : (
          <ul className="divide-y divide-[#f1e6f0]">
            {sections.map((sec, idx) => (
              <li key={sec.id} className="px-4 py-4 flex items-center gap-4 hover:bg-[#fbf7fc] transition-colors">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="w-6 h-6 flex items-center justify-center rounded bg-[var(--color-light)] hover:bg-[var(--color-lavender-light)] disabled:opacity-30 text-[var(--color-secondary)] transition-colors">↑</button>
                  <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} className="w-6 h-6 flex items-center justify-center rounded bg-[var(--color-light)] hover:bg-[var(--color-lavender-light)] disabled:opacity-30 text-[var(--color-secondary)] transition-colors">↓</button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="admin-badge bg-[var(--color-lavender-light)] text-[var(--color-secondary)]">{sec.section_type}</span>
                    <span className="font-medium text-[var(--color-text)]">{sec.title || '(untitled)'}</span>
                    {!sec.is_visible && <span className="text-xs text-[var(--color-muted)]">hidden</span>}
                  </div>
                  {sec.subtitle && <div className="text-sm text-[var(--color-muted)] truncate">{sec.subtitle}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleVisibility(sec)} className="px-2 py-1 text-[var(--color-muted)] hover:text-[var(--color-text)] text-xs font-medium transition-colors">{sec.is_visible ? 'Hide' : 'Show'}</button>
                  <button onClick={() => openEdit(sec)} className="px-2 py-1 text-[var(--color-primary)] hover:text-[var(--color-secondary)] text-xs font-medium transition-colors">Edit</button>
                  <button onClick={() => handleDelete(sec.id)} className="px-2 py-1 text-red-600 hover:text-red-800 text-xs font-medium transition-colors">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="admin-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-heading font-semibold text-[var(--color-secondary)] mb-4">{editingSection ? 'Edit Section' : 'Add Section'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="admin-label">Section Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  disabled={!!editingSection}
                  className="admin-input"
                >
                  {SECTION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label className="admin-label">Subtitle</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="admin-input" />
              </div>

              {renderTypeFields()}

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_visible" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                <label htmlFor="is_visible" className="text-sm text-[var(--color-text)]">Visible</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">Cancel</button>
                <button type="submit" className="admin-btn-primary">{editingSection ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
