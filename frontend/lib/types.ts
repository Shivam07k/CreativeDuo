export interface DesignToken {
  id: string;
  type: string;
  key: string;
  value: string;
  description: string | null;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  type: 'page' | 'category' | 'custom_link';
  page_id: string | null;
  category_id: string | null;
  url: string | null;
  display_order: number;
  is_visible: boolean;
  parent_id: string | null;
  children?: MenuItem[];
  page_title?: string;
  category_slug?: string;
}

export interface Menu {
  id: string;
  name: string;
  location: string;
  items: MenuItem[];
}

export interface PageSection {
  id: string;
  page_id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, any>;
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
  is_visible: boolean;
  display_order: number;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  is_visible: boolean;
  sections: PageSection[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_visible: boolean;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  price: number;
  currency: string;
  is_visible: boolean;
  is_featured: boolean;
  display_order: number;
  category_id: string | null;
  images: { url: string; alt: string; display_order: number }[];
  metadata: Record<string, any>;
  category_name?: string;
  category_slug?: string;
  category?: { slug: string; name: string } | null;
}

export interface SiteSettings {
  [key: string]: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}
