'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: string;
  label: string;
  type: 'page' | 'category' | 'custom_link';
  target_id?: string | null;
  url?: string | null;
  display_order: number;
  is_visible: boolean;
  parent_id?: string | null;
  resolved_target?: { name?: string; slug?: string } | null;
  children?: MenuItem[];
}

interface NavbarProps {
  menu: {
    id: string;
    name: string;
    location: string;
    items: MenuItem[];
  };
  settings: Record<string, string>;
}

function getItemHref(item: MenuItem): string {
  switch (item.type) {
    case 'page':
      return `/${item.resolved_target?.slug || ''}`;
    case 'category':
      return `/shop/${item.resolved_target?.slug || ''}`;
    case 'custom_link':
      return item.url || '#';
    default:
      return '#';
  }
}

export default function Navbar({ menu, settings }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const brandName = settings.brand_name || 'Creative Duo';
  const tagline = settings.tagline || 'RESIN & CO.';
  const logoUrl = settings.logo_url || '';

  return (
    <header className="sticky top-0 z-50 border-b border-[#eee2eb] bg-[rgba(255,250,245,0.92)] backdrop-blur-[18px]">
      <div className="mx-auto flex h-[96px] max-w-[1440px] items-center justify-between px-[6%] max-md:h-[76px] max-md:px-[5%]">
        <Link href="/" className="group flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName}
              className="h-[62px] w-[62px] rounded-full border-2 border-[#e6d6ee] object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 max-md:h-[48px] max-md:w-[48px]"
            />
          ) : (
            <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 border-[#e3d3ea] bg-gradient-to-br from-[var(--color-lavender-light)] to-[var(--color-blush)] font-heading text-2xl text-[var(--color-secondary)] shadow-sm transition-transform duration-300 group-hover:scale-105 max-md:h-[48px] max-md:w-[48px] max-md:text-lg">
              {brandName.charAt(0)}
            </div>
          )}
          <div className="leading-none">
            <span className="block font-heading text-[28px] tracking-[0.5px] text-[var(--color-secondary)] max-md:text-[22px]">
              {brandName}
            </span>
            <small className="mt-1 block text-center text-[8px] uppercase tracking-[5px] text-[var(--color-muted)] max-md:text-[7px]">
              {tagline}
            </small>
          </div>
        </Link>

        <nav className="hidden items-center gap-[2.1vw] lg:gap-8 md:flex">
          {menu.items.map((item) => {
            const children = item.children || [];
            return children.length > 0 ? (
                <div key={item.id} className="group relative">
                  <button className="flex items-center gap-1.5 text-[15px] font-medium tracking-[1px] text-[var(--color-text)] transition-colors duration-300 hover:text-[var(--color-primary)]">
                    {item.label}
                    <svg className="mt-0.5 h-3 w-3 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-1/2 top-full -translate-x-1/2 pt-4 opacity-0 translate-y-2 invisible transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible">
                    <div className="w-56 overflow-hidden rounded-2xl border border-[#ead9ea] bg-white p-2 shadow-[0_12px_32px_-12px_rgba(118,86,127,0.35)]">
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          href={getItemHref(child)}
                          className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition-colors duration-200 hover:bg-[var(--color-lavender-light)] hover:text-[var(--color-primary)]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.id}
                  href={getItemHref(item)}
                  className="group relative text-[15px] font-medium tracking-[1px] text-[var(--color-text)] transition-colors duration-300 hover:text-[var(--color-primary)]"
                >
                  {item.label}
                  <span className="absolute -bottom-1.5 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-[var(--color-primary)] transition-all duration-300 group-hover:w-full" />
                </Link>
              );
            })}

          <div className="mx-1 h-6 w-px bg-[#ead9ea]" />

          <Link
            href="/admin/login"
            className="rounded-full border border-[var(--color-primary)] bg-white/60 px-5 py-2.5 text-[14px] font-semibold tracking-[1px] text-[var(--color-primary)] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md"
          >
            Login
          </Link>

          <Link
            href="/cart"
            className="relative text-[22px] text-[var(--color-secondary)] transition-transform duration-300 hover:-translate-y-0.5 hover:text-[var(--color-primary)]"
            aria-label="Cart"
          >
            &#9825;
            <span className="absolute -right-2 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-semibold leading-none text-white shadow-sm">
              0
            </span>
          </Link>
        </nav>

        <button
          className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] border-none bg-transparent md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`h-[2px] w-6 rounded-full bg-[var(--color-secondary)] transition-all duration-300 ${mobileOpen ? 'translate-y-[7px] rotate-45' : ''}`}
          />
          <span
            className={`h-[2px] w-6 rounded-full bg-[var(--color-secondary)] transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`h-[2px] w-6 rounded-full bg-[var(--color-secondary)] transition-all duration-300 ${mobileOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
          />
        </button>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-[#eadfea] bg-[rgba(255,250,245,0.98)] px-6 pb-6 pt-3 md:hidden">
          {menu.items
            .map((item) => {
              const children = item.children || [];
              return (
                <div key={item.id}>
                  <Link
                    href={getItemHref(item)}
                    className="block rounded-lg px-2 py-2.5 text-[17px] font-medium tracking-[1px] text-[var(--color-text)] transition-colors duration-200 hover:bg-[var(--color-light)] hover:text-[var(--color-primary)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {children.length > 0 && (
                    <div className="ml-4 flex flex-col gap-0.5 border-l-2 border-[var(--color-lavender-light)] pl-3">
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          href={getItemHref(child)}
                          className="block rounded-lg px-2 py-2 text-[15px] font-medium text-[var(--color-muted)] transition-colors duration-200 hover:bg-[var(--color-light)] hover:text-[var(--color-primary)]"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

          <div className="mt-2 flex items-center gap-3 border-t border-[#f0e4ef] pt-4">
            <Link
              href="/admin/login"
              className="flex-1 rounded-full bg-[var(--color-primary)] px-4 py-2.5 text-center text-[15px] font-semibold tracking-[1px] text-white transition-colors duration-200 hover:bg-[var(--color-secondary)]"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/cart"
              className="flex-1 rounded-full border border-[var(--color-primary)] px-4 py-2.5 text-center text-[15px] font-medium tracking-[1px] text-[var(--color-primary)] transition-colors duration-200 hover:bg-[var(--color-light)]"
              onClick={() => setMobileOpen(false)}
            >
              &#9825; Cart (0)
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
