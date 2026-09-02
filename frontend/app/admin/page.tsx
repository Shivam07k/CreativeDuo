'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

interface Stats {
  pages: number;
  categories: number;
  products: number;
  menus: number;
  designTokens: number;
}

const CARDS = [
  { key: 'pages' as const, label: 'Pages', href: '/admin/pages', icon: '📄', color: 'from-[#aa8bc5] to-[#8a6aa8]' },
  { key: 'categories' as const, label: 'Categories', href: '/admin/categories', icon: '📁', color: 'from-[#b89498] to-[#9a767c]' },
  { key: 'products' as const, label: 'Products', href: '/admin/products', icon: '🛍️', color: 'from-[#76567f] to-[#5a3f63]' },
  { key: 'menus' as const, label: 'Menus', href: '/admin/menus', icon: '📋', color: 'from-[#e0b48a] to-[#c9925f]' },
  { key: 'designTokens' as const, label: 'Design Tokens', href: '/admin/design', icon: '🎨', color: 'from-[#d68fb0] to-[#c06a92]' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ pages: 0, categories: 0, products: 0, menus: 0, designTokens: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadStats(token);
  }, [router]);

  async function loadStats(token: string) {
    setLoading(true);
    try {
      const [pages, categories, products, menus, designTokens] = await Promise.allSettled([
        fetchAPI<{ data: any[] }>('/api/admin/pages', token),
        fetchAPI<{ data: any[] }>('/api/admin/categories', token),
        fetchAPI<{ data: any[] }>('/api/admin/products', token),
        fetchAPI<{ data: any[] }>('/api/admin/menus', token),
        fetchAPI<{ data: any[] }>('/api/admin/design-tokens', token),
      ]);

      setStats({
        pages: pages.status === 'fulfilled' ? (pages.value.data?.length || 0) : 0,
        categories: categories.status === 'fulfilled' ? (categories.value.data?.length || 0) : 0,
        products: products.status === 'fulfilled' ? (products.value.data?.length || 0) : 0,
        menus: menus.status === 'fulfilled' ? (menus.value.data?.length || 0) : 0,
        designTokens: designTokens.status === 'fulfilled' ? (designTokens.value.data?.length || 0) : 0,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex items-center gap-3 rounded-2xl bg-white px-6 py-4 border border-[#ead9ea] shadow-sm">
          <span className="h-4 w-4 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
          <span className="text-[var(--color-muted)] text-sm font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="admin-page-title">Welcome back!</h2>
        <p className="text-[var(--color-muted)] mt-1.5">Manage your site content from here.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
        {CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group admin-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_-12px_rgba(118,86,127,0.35)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </span>
            </div>
            <div className="text-[32px] font-heading font-bold text-[var(--color-secondary)]">{stats[card.key]}</div>
            <div className="text-sm font-medium text-[var(--color-muted)] mt-1 group-hover:text-[var(--color-primary)] transition-colors duration-200">
              {card.label}
            </div>
          </Link>
        ))}
      </div>

      <div className="admin-card">
        <h3 className="text-lg font-heading font-semibold text-[var(--color-secondary)] mb-5">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/admin/pages" className="flex items-center gap-2.5 px-4 py-3 bg-[var(--color-light)] rounded-xl hover:bg-[var(--color-lavender-light)] hover:text-[var(--color-secondary)] text-sm font-semibold text-[var(--color-text)] transition-all duration-200 border border-transparent hover:border-[#ead9ea]">
            <span>📄</span> Manage Pages
          </Link>
          <Link href="/admin/products" className="flex items-center gap-2.5 px-4 py-3 bg-[var(--color-light)] rounded-xl hover:bg-[var(--color-lavender-light)] hover:text-[var(--color-secondary)] text-sm font-semibold text-[var(--color-text)] transition-all duration-200 border border-transparent hover:border-[#ead9ea]">
            <span>🛍️</span> Manage Products
          </Link>
          <Link href="/admin/categories" className="flex items-center gap-2.5 px-4 py-3 bg-[var(--color-light)] rounded-xl hover:bg-[var(--color-lavender-light)] hover:text-[var(--color-secondary)] text-sm font-semibold text-[var(--color-text)] transition-all duration-200 border border-transparent hover:border-[#ead9ea]">
            <span>📁</span> Manage Categories
          </Link>
          <Link href="/admin/design" className="flex items-center gap-2.5 px-4 py-3 bg-[var(--color-light)] rounded-xl hover:bg-[var(--color-lavender-light)] hover:text-[var(--color-secondary)] text-sm font-semibold text-[var(--color-text)] transition-all duration-200 border border-transparent hover:border-[#ead9ea]">
            <span>🎨</span> Design Tokens
          </Link>
        </div>
      </div>
    </div>
  );
}
