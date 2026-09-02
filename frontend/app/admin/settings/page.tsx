'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI, putAPI, uploadFile } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';

const KNOWN_SETTINGS: { key: string; label: string; type: 'text' | 'email' | 'file' }[] = [
  { key: 'brand_name', label: 'Brand Name', type: 'text' },
  { key: 'tagline', label: 'Tagline', type: 'text' },
  { key: 'slogan', label: 'Slogan', type: 'text' },
  { key: 'contact_email', label: 'Contact Email', type: 'email' },
  { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text' },
  { key: 'instagram_handle', label: 'Instagram Handle', type: 'text' },
  { key: 'logo_url', label: 'Logo', type: 'file' },
  { key: 'favicon_url', label: 'Favicon', type: 'file' },
  { key: 'footer_tagline', label: 'Footer Tagline', type: 'text' },
  { key: 'copyright', label: 'Copyright Text', type: 'text' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });

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
    loadSettings(token);
  }, [router]);

  async function loadSettings(token: string) {
    setLoading(true);
    try {
      const res = await fetchAPI<{ data: SiteSettings }>('/api/admin/settings', token);
      setSettings(res.data || {});
    } catch {
      flash('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFileUpload(key: string, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const token = getToken();
    try {
      const res = await uploadFile('/api/admin/upload', fileList[0], 'settings', token);
      setSettings((prev) => ({ ...prev, [key]: res.url }));
      flash('File uploaded', 'success');
    } catch (err: any) {
      flash(err?.message || 'Upload failed', 'error');
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    setSaving(true);
    try {
      await putAPI('/api/admin/settings', settings, token);
      flash('Settings saved', 'success');
    } catch (err: any) {
      flash(err?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleClear(key: string) {
    handleChange(key, '');
  }

  const knownKeys = KNOWN_SETTINGS.map((s) => s.key);
  const extraKeys = Object.keys(settings).filter((k) => !knownKeys.includes(k));

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">Loading settings...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="admin-page-title">Site Settings</h2>
        <p className="text-[var(--color-muted)] text-sm mt-1">Manage global site configuration.</p>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-[#f2ede8] text-[var(--color-secondary)] border border-[#e3d3ea]' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="admin-card max-w-2xl">
        <div className="space-y-5">
          {KNOWN_SETTINGS.map((setting) => (
            <div key={setting.key}>
              <label className="admin-label">{setting.label}</label>
              {setting.type === 'file' ? (
                <div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(setting.key, e.target.files)}
                      className="w-full text-sm text-[var(--color-muted)] file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-[var(--color-lavender-light)] file:text-[var(--color-secondary)] file:font-medium hover:file:bg-[var(--color-blush)] file:cursor-pointer cursor-pointer"
                    />
                    {settings[setting.key] && (
                      <button
                        type="button"
                        onClick={() => handleClear(setting.key)}
                        className="admin-btn-danger text-xs px-3 py-2"
                      >
                        ✕ Clear {setting.label}
                      </button>
                    )}
                  </div>
                  {settings[setting.key] && (
                    <div className="mt-2 flex items-center gap-3">
                      {setting.key === 'logo_url' && <img src={settings[setting.key]} alt="logo" className="h-10 object-contain bg-[var(--color-light)] rounded-lg border border-[#ead9ea] p-1" />}
                      {setting.key === 'favicon_url' && <img src={settings[setting.key]} alt="favicon" className="h-10 w-10 object-contain bg-[var(--color-light)] rounded-lg border border-[#ead9ea] p-1" />}
                      <input
                        type="text"
                        value={settings[setting.key]}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        className="admin-input font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type={setting.type}
                  value={settings[setting.key] || ''}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="admin-input"
                  placeholder={`Enter ${setting.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>

        {extraKeys.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#ead9ea]">
            <h3 className="text-sm font-semibold text-[var(--color-secondary)] mb-4">Additional Settings</h3>
            <div className="space-y-4">
              {extraKeys.map((key) => (
                <div key={key}>
                  <label className="admin-label">{key}</label>
                  <input
                    type="text"
                    value={settings[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="admin-input"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="admin-btn-primary px-6"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
