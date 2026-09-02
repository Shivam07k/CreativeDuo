import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchAPI } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface ApiDesignToken {
  id: string;
  type: string;
  key: string;
  value: string;
  description: string | null;
  is_active: boolean;
}

interface MenuItemWithTarget {
  id: string;
  label: string;
  type: 'page' | 'category' | 'custom_link';
  page_id?: string | null;
  category_id?: string | null;
  url?: string | null;
  display_order: number;
  is_visible: boolean;
  parent_id?: string | null;
  resolved_target?: { name?: string; slug?: string } | null;
  children?: MenuItemWithTarget[];
}

interface MenuWithItems {
  id: string;
  name: string;
  location: string;
  items: MenuItemWithTarget[];
}

const DEFAULT_SETTINGS: SiteSettings = {
  brand_name: 'Creative Duo',
  tagline: 'RESIN & CO.',
  logo_url: '',
  footer_tagline: 'You feel it, we preserve it.',
  copyright: '© 2026 Creative Duo Resin. Handmade with love.',
};

const DEFAULT_DESIGN_TOKENS: ApiDesignToken[] = [
  { id: '1', type: 'color', key: 'primary', value: '#aa8bc5', description: null, is_active: true },
  { id: '2', type: 'color', key: 'secondary', value: '#76567f', description: null, is_active: true },
  { id: '3', type: 'color', key: 'background', value: '#fffaf5', description: null, is_active: true },
  { id: '4', type: 'color', key: 'text', value: '#332b35', description: null, is_active: true },
  { id: '5', type: 'color', key: 'accent', value: '#b89498', description: null, is_active: true },
  { id: '6', type: 'color', key: 'light', value: '#f8f0e9', description: null, is_active: true },
  { id: '7', type: 'color', key: 'muted', value: '#817580', description: null, is_active: true },
  { id: '8', type: 'color', key: 'white', value: '#ffffff', description: null, is_active: true },
  { id: '9', type: 'color', key: 'lavender-light', value: '#eee4f3', description: null, is_active: true },
  { id: '10', type: 'color', key: 'blush', value: '#f4e3ea', description: null, is_active: true },
  { id: '11', type: 'font', key: 'heading', value: 'Cormorant Garamond', description: null, is_active: true },
  { id: '12', type: 'font', key: 'body', value: 'DM Sans', description: null, is_active: true },
  { id: '13', type: 'font', key: 'script', value: 'Italianno', description: null, is_active: true },
];

const DEFAULT_MAIN_MENU: MenuWithItems = {
  id: 'default-main',
  name: 'Main Menu',
  location: 'main',
  items: [
    { id: '1', label: 'HOME', type: 'custom_link', url: '/', display_order: 0, is_visible: true, parent_id: null },
    { id: '2', label: 'SHOP', type: 'custom_link', url: '/shop', display_order: 1, is_visible: true, parent_id: null },
    { id: '3', label: 'CUSTOM ORDERS', type: 'custom_link', url: '/custom-orders', display_order: 2, is_visible: true, parent_id: null },
    { id: '4', label: 'GALLERY', type: 'custom_link', url: '/gallery', display_order: 3, is_visible: true, parent_id: null },
    { id: '5', label: 'ABOUT US', type: 'custom_link', url: '/about', display_order: 4, is_visible: true, parent_id: null },
    { id: '6', label: 'FAQS', type: 'custom_link', url: '/faq', display_order: 5, is_visible: true, parent_id: null },
    { id: '7', label: 'CONTACT', type: 'custom_link', url: '/contact', display_order: 6, is_visible: true, parent_id: null },
  ],
};

const DEFAULT_FOOTER_MENU: MenuWithItems = {
  id: 'default-footer',
  name: 'Footer Menu',
  location: 'footer',
  items: [
    { id: '1', label: 'Home', type: 'custom_link', url: '/', display_order: 0, is_visible: true, parent_id: null },
    { id: '2', label: 'Shop', type: 'custom_link', url: '/shop', display_order: 1, is_visible: true, parent_id: null },
    { id: '3', label: 'Custom Orders', type: 'custom_link', url: '/custom-orders', display_order: 2, is_visible: true, parent_id: null },
    { id: '4', label: 'Gallery', type: 'custom_link', url: '/gallery', display_order: 3, is_visible: true, parent_id: null },
    { id: '5', label: 'Contact', type: 'custom_link', url: '/contact', display_order: 4, is_visible: true, parent_id: null },
  ],
};

function buildGoogleFontsUrl(fontNames: string[]): string {
  const weightFonts = ['Cormorant Garamond', 'DM Sans', 'Playfair Display', 'Lora', 'Montserrat', 'Poppins', 'Raleway'];
  const italicFonts = ['Cormorant Garamond', 'Playfair Display', 'Lora'];

  const params = fontNames.map((name) => {
    const isWeight = weightFonts.includes(name);
    const isItalic = italicFonts.includes(name);
    const encoded = name.replace(/ /g, '+');

    if (name === 'Italianno' || name === 'Great Vibes' || name === 'Dancing Script' || name === 'Pacifico' || name === 'Sacramento' || name === 'Satisfy') {
      return `family=${encoded}`;
    }
    if (isWeight && isItalic) {
      return `family=${encoded}:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500`;
    }
    if (isWeight) {
      return `family=${encoded}:wght@400;500;600;700`;
    }
    return `family=${encoded}`;
  });

  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}

function getFontFamilyString(fontName: string): string {
  const serifFonts = ['Cormorant Garamond', 'Playfair Display', 'Lora', 'Merriweather', 'Georgia'];
  const scriptFonts = ['Italianno', 'Great Vibes', 'Dancing Script', 'Pacifico', 'Sacramento', 'Satisfy'];

  if (scriptFonts.includes(fontName)) {
    return `'${fontName}', cursive`;
  }
  if (serifFonts.includes(fontName)) {
    return `'${fontName}', Georgia, serif`;
  }
  return `'${fontName}', Arial, sans-serif`;
}

export const metadata: Metadata = {
  title: {
    default: 'Creative Duo Resin | Handcrafted Resin Creations',
    template: '%s | Creative Duo Resin',
  },
  description: 'Handmade resin creations to celebrate every little memory. Custom orders, keychains, earrings, photo products and more.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let tokens = DEFAULT_DESIGN_TOKENS;
  let settings = DEFAULT_SETTINGS;
  let mainMenu = DEFAULT_MAIN_MENU;
  let footerMenu = DEFAULT_FOOTER_MENU;

  const [tokensResult, settingsResult, mainMenuResult, footerMenuResult] = await Promise.allSettled([
    fetchAPI<{ data: ApiDesignToken[] }>('/api/design-tokens'),
    fetchAPI<{ data: SiteSettings }>('/api/settings'),
    fetchAPI<{ data: MenuWithItems }>('/api/menus/main'),
    fetchAPI<{ data: MenuWithItems }>('/api/menus/footer'),
  ]);

  if (tokensResult.status === 'fulfilled' && tokensResult.value.data) {
    tokens = tokensResult.value.data;
  }
  if (settingsResult.status === 'fulfilled' && settingsResult.value.data) {
    settings = { ...DEFAULT_SETTINGS, ...settingsResult.value.data };
  }
  if (mainMenuResult.status === 'fulfilled' && mainMenuResult.value.data) {
    mainMenu = mainMenuResult.value.data;
  }
  if (footerMenuResult.status === 'fulfilled' && footerMenuResult.value.data) {
    footerMenu = footerMenuResult.value.data;
  }

  const cssVars: Record<string, string> = {};
  const fontNames = new Set<string>();

  tokens.forEach((token) => {
    const varName = `--${token.type}-${token.key}`;

    if (token.type === 'font') {
      cssVars[varName] = getFontFamilyString(token.value);
      fontNames.add(token.value);
    } else {
      cssVars[varName] = token.value;
    }
  });

  const googleFontsUrl = fontNames.size > 0
    ? buildGoogleFontsUrl(Array.from(fontNames))
    : 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600;700&family=Italianno&display=swap';

  const rootStyle = cssVars as React.CSSProperties;

  return (
    <html lang="en" style={rootStyle}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontsUrl} rel="stylesheet" />
      </head>
      <body>
        <Navbar menu={mainMenu} settings={settings} />
        <main className="min-h-screen">{children}</main>
        <Footer menu={footerMenu} settings={settings} />
      </body>
    </html>
  );
}
