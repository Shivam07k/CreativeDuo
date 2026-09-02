'use client';

import Link from 'next/link';

interface FooterMenuItem {
  id: string;
  label: string;
  type: 'page' | 'category' | 'custom_link';
  url?: string | null;
  resolved_target?: { name?: string; slug?: string } | null;
}

interface FooterProps {
  menu: {
    id: string;
    name: string;
    location: string;
    items: FooterMenuItem[];
  };
  settings: Record<string, string>;
}

function getItemHref(item: FooterMenuItem): string {
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

export default function Footer({ menu, settings }: FooterProps) {
  const brandName = settings.brand_name || 'Creative Duo';
  const tagline = settings.tagline || 'RESIN & CO.';
  const logoUrl = settings.logo_url || '';
  const footerTagline = settings.footer_tagline || 'You feel it, we preserve it.';
  const copyright = settings.copyright || '© 2026 Creative Duo Resin. Handmade with love.';

  return (
    <footer className="flex flex-wrap items-center justify-between gap-6 bg-[#5d4b63] px-[7%] py-[45px] text-white max-md:justify-center max-md:text-center">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={brandName}
            className="h-[58px] w-[58px] rounded-full object-cover"
          />
        ) : (
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/20 font-heading text-xl">
            {brandName.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="font-heading text-[25px] font-normal">{brandName}</h3>
          <small className="text-[7px] tracking-[3px] opacity-80">{tagline}</small>
        </div>
      </div>

      <p className="font-heading text-[17px] italic">&#9825; {footerTagline}</p>

      <div className="flex flex-wrap gap-[18px] text-[10px] max-md:justify-center">
        {menu.items.map((item) => (
          <Link
            key={item.id}
            href={getItemHref(item)}
            className="transition-opacity duration-300 hover:opacity-80"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="w-full border-t border-white/15 pt-5 text-center text-[9px] opacity-70">
        {copyright}
      </div>
    </footer>
  );
}
