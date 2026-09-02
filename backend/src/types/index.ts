import { Request } from 'express';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export interface AdminRequest extends Request {
  user?: AdminUser;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export interface DesignToken {
  id?: string;
  name: string;
  value: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Menu {
  id?: string;
  name: string;
  location: string;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id?: string;
  menu_id: string;
  parent_id?: string | null;
  label: string;
  type: 'link' | 'page' | 'category' | 'url';
  target_id?: string | null;
  url?: string | null;
  display_order: number;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Page {
  id?: string;
  title: string;
  slug: string;
  content?: string;
  is_visible: boolean;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PageSection {
  id?: string;
  page_id: string;
  title?: string;
  content?: string;
  type: string;
  display_order: number;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  category_id?: string;
  image_url?: string;
  images?: string[];
  is_visible: boolean;
  is_featured: boolean;
  display_order: number;
  stock_quantity?: number;
  sku?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SiteSetting {
  id?: string;
  key: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}
