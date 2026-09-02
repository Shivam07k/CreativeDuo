'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Design Tokens', href: '/admin/design', icon: '🎨' },
  { label: 'Menus', href: '/admin/menus', icon: '📋' },
  { label: 'Pages', href: '/admin/pages', icon: '📄' },
  { label: 'Categories', href: '/admin/categories', icon: '📁' },
  { label: 'Products', href: '/admin/products', icon: '🛍️' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#f7f1f9]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-[var(--color-secondary)] to-[#5a3f63] text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 h-16 px-5 border-b border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 font-heading text-lg text-white">
            CD
          </div>
          <div className="leading-tight">
            <span className="block text-[15px] font-bold tracking-wide">Admin Panel</span>
            <span className="block text-[11px] uppercase tracking-widest text-white/60">Creative Duo</span>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white transition-all duration-150"
          >
            <span className="text-base">🌐</span>
            View Site
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center h-16 px-5 bg-white/80 backdrop-blur border-b border-[#ead9ea] shrink-0">
          <button
            className="lg:hidden mr-3 p-2 rounded-lg text-[var(--color-secondary)] hover:bg-[var(--color-light)] transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="admin-page-title text-[22px]">
            {NAV_ITEMS.find((i) =>
              i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href)
            )?.label || 'Admin'}
          </h1>
          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-[#f3c4c4] text-red-500 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
