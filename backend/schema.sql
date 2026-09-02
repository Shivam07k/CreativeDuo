-- ============================================================
-- Creative Duo Resin – CMS / E-Commerce Schema
-- Run against a Supabase (PostgreSQL 15+) project.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. TABLES
-- ============================================================

-- ── design_tokens ───────────────────────────────────────────
CREATE TABLE public.design_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL,
  key         text NOT NULL,
  value       text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, key)
);

-- ── admin_profiles ──────────────────────────────────────────
CREATE TABLE public.admin_profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  username   text UNIQUE,
  role       text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── pages ───────────────────────────────────────────────────
CREATE TABLE public.pages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  slug             text NOT NULL UNIQUE,
  meta_title       text,
  meta_description text,
  is_visible       boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── categories ──────────────────────────────────────────────
CREATE TABLE public.categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  image_url     text,
  is_visible    boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── products ────────────────────────────────────────────────
CREATE TABLE public.products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  slug             text NOT NULL UNIQUE,
  description      text NOT NULL,
  short_description text,
  price            numeric NOT NULL,
  currency         text NOT NULL DEFAULT 'INR',
  is_visible       boolean NOT NULL DEFAULT true,
  is_featured      boolean NOT NULL DEFAULT false,
  display_order    int NOT NULL DEFAULT 0,
  category_id      uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  images           jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── page_sections ───────────────────────────────────────────
CREATE TABLE public.page_sections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id          uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  section_type     text NOT NULL,
  title            text,
  subtitle         text,
  content          jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url        text,
  background_color text,
  text_color       text,
  is_visible       boolean NOT NULL DEFAULT true,
  display_order    int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── menus ───────────────────────────────────────────────────
CREATE TABLE public.menus (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  location   text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── menu_items ──────────────────────────────────────────────
CREATE TABLE public.menu_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id       uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  label         text NOT NULL,
  type          text NOT NULL CHECK (type IN ('page', 'category', 'custom_link')),
  page_id       uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  category_id   uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  url           text,
  display_order int NOT NULL DEFAULT 0,
  is_visible    boolean NOT NULL DEFAULT true,
  parent_id     uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── site_settings ───────────────────────────────────────────
CREATE TABLE public.site_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. HELPER FUNCTION – is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.id = auth.uid()
  );
$$;

-- ============================================================
-- 4. ROW-LEVEL SECURITY
-- ============================================================
ALTER TABLE public.design_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings  ENABLE ROW LEVEL SECURITY;

-- ── design_tokens ───────────────────────────────────────────
CREATE POLICY "design_tokens_select_public"
  ON public.design_tokens FOR SELECT
  USING (is_active = true);

CREATE POLICY "design_tokens_insert_admin"
  ON public.design_tokens FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "design_tokens_update_admin"
  ON public.design_tokens FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "design_tokens_delete_admin"
  ON public.design_tokens FOR DELETE
  USING (is_admin());

-- ── admin_profiles ──────────────────────────────────────────
CREATE POLICY "admin_profiles_select_own"
  ON public.admin_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "admin_profiles_insert_own"
  ON public.admin_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin_profiles_update_own"
  ON public.admin_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── pages ───────────────────────────────────────────────────
CREATE POLICY "pages_select_public"
  ON public.pages FOR SELECT
  USING (is_visible = true);

CREATE POLICY "pages_insert_admin"
  ON public.pages FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "pages_update_admin"
  ON public.pages FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "pages_delete_admin"
  ON public.pages FOR DELETE
  USING (is_admin());

-- ── categories ──────────────────────────────────────────────
CREATE POLICY "categories_select_public"
  ON public.categories FOR SELECT
  USING (is_visible = true);

CREATE POLICY "categories_insert_admin"
  ON public.categories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "categories_update_admin"
  ON public.categories FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "categories_delete_admin"
  ON public.categories FOR DELETE
  USING (is_admin());

-- ── products ────────────────────────────────────────────────
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (is_visible = true);

CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "products_delete_admin"
  ON public.products FOR DELETE
  USING (is_admin());

-- ── page_sections ───────────────────────────────────────────
CREATE POLICY "page_sections_select_public"
  ON public.page_sections FOR SELECT
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_sections.page_id
        AND p.is_visible = true
    )
  );

CREATE POLICY "page_sections_insert_admin"
  ON public.page_sections FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "page_sections_update_admin"
  ON public.page_sections FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "page_sections_delete_admin"
  ON public.page_sections FOR DELETE
  USING (is_admin());

-- ── menus ───────────────────────────────────────────────────
CREATE POLICY "menus_select_public"
  ON public.menus FOR SELECT
  USING (true);

CREATE POLICY "menus_insert_admin"
  ON public.menus FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "menus_update_admin"
  ON public.menus FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "menus_delete_admin"
  ON public.menus FOR DELETE
  USING (is_admin());

-- ── menu_items ──────────────────────────────────────────────
CREATE POLICY "menu_items_select_public"
  ON public.menu_items FOR SELECT
  USING (is_visible = true);

CREATE POLICY "menu_items_insert_admin"
  ON public.menu_items FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "menu_items_update_admin"
  ON public.menu_items FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "menu_items_delete_admin"
  ON public.menu_items FOR DELETE
  USING (is_admin());

-- ── site_settings ───────────────────────────────────────────
CREATE POLICY "site_settings_select_public"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "site_settings_insert_admin"
  ON public.site_settings FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "site_settings_update_admin"
  ON public.site_settings FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "site_settings_delete_admin"
  ON public.site_settings FOR DELETE
  USING (is_admin());

-- ============================================================
-- 5. STORAGE BUCKET – resin-art-assets
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resin-art-assets', 'resin-art-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resin-art-assets');

CREATE POLICY "storage_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resin-art-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "storage_update_authenticated"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resin-art-assets'
    AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'resin-art-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "storage_delete_authenticated"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resin-art-assets'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- 6. SEED DATA
-- ============================================================

-- ── 5a. Design Tokens ───────────────────────────────────────

-- Colors
INSERT INTO public.design_tokens (type, key, value, description) VALUES
('color', 'primary',    '#aa8bc5', 'Primary brand color – soft purple'),
('color', 'secondary',  '#76567f', 'Secondary brand color – deep plum'),
('color', 'background', '#fffaf5', 'Page background – warm off-white'),
('color', 'text',       '#332b35', 'Body text color – dark aubergine'),
('color', 'accent',     '#b89498', 'Accent color – dusty rose'),
('color', 'light',      '#f8f0e9', 'Light surface color'),
('color', 'muted',      '#817580', 'Muted text / border color'),
('color', 'white',      '#ffffff', 'White');

-- Fonts
INSERT INTO public.design_tokens (type, key, value, description) VALUES
('font', 'heading', 'Cormorant Garamond', 'Heading / display font'),
('font', 'body',    'DM Sans',            'Body / UI font'),
('font', 'script',  'Italianno',          'Decorative script font');

-- ── 5b. Site Settings ───────────────────────────────────────
INSERT INTO public.site_settings (key, value) VALUES
('brand_name',   'Creative Duo'),
('tagline',      'RESIN & CO.'),
('slogan',       'You feel it, we preserve it'),
('contact_email','hello@creativeduoresin.com'),
('whatsapp_number', ''),
('instagram_handle', ''),
('logo_url',     ''),
('favicon_url',  ''),
('footer_tagline', 'Handcrafted resin art, made with love.'),
('copyright',    '© 2026 Creative Duo Resin & Co. All rights reserved.');

-- ── 5c. Menus ───────────────────────────────────────────────
INSERT INTO public.menus (id, name, location) VALUES
('a0000000-0000-0000-0000-000000000001', 'Main Navigation', 'main'),
('a0000000-0000-0000-0000-000000000002', 'Footer Navigation', 'footer');

-- ── 5d. Pages ───────────────────────────────────────────────
INSERT INTO public.pages (id, title, slug, meta_title, meta_description) VALUES
('b0000000-0000-0000-0000-000000000001', 'Home',             'home',             'Creative Duo – Custom Resin Art & Preserved Keepsakes', 'Handcrafted resin art and preservation pieces made with love in India.'),
('b0000000-0000-0000-0000-000000000002', 'About Us',          'about',            'About – Creative Duo Resin Art',                      'Learn about the artists behind Creative Duo resin art.'),
('b0000000-0000-0000-0000-000000000003', 'Contact',           'contact',          'Contact – Creative Duo Resin Art',                     'Get in touch with Creative Duo for custom resin orders.'),
('b0000000-0000-0000-0000-000000000004', 'Shop',              'shop',             'Shop – Creative Duo Resin Art',                        'Browse our handcrafted resin art collection.');

-- ── 5e. Categories ──────────────────────────────────────────
INSERT INTO public.categories (id, name, slug, description, display_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'Preserved Flower Art',   'preserved-flower-art',   'Elegant resin pieces preserving real flowers',  1),
('c0000000-0000-0000-0000-000000000002', 'Jewellery',              'jewellery',              'Resin jewellery – rings, pendants & more',      2),
('c0000000-0000-0000-0000-000000000003', 'Home Decor',             'home-decor',             'Resin home décor – trays, coasters & art',      3),
('c0000000-0000-0000-0000-000000000004', 'Custom & Personalised',  'custom-personalised',    'Bespoke pieces made to your vision',            4);

-- ── 5f. Menu Items – Main Navigation ────────────────────────
INSERT INTO public.menu_items (menu_id, label, type, page_id, category_id, url, display_order) VALUES
('a0000000-0000-0000-0000-000000000001', 'Home',        'page',        'b0000000-0000-0000-0000-000000000001', NULL,                  NULL, 1),
('a0000000-0000-0000-0000-000000000001', 'Shop',        'page',        'b0000000-0000-0000-0000-000000000004', NULL,                  NULL, 2),
('a0000000-0000-0000-0000-000000000001', 'About',       'page',        'b0000000-0000-0000-0000-000000000002', NULL,                  NULL, 3),
('a0000000-0000-0000-0000-000000000001', 'Contact',     'page',        'b0000000-0000-0000-0000-000000000003', NULL,                  NULL, 4);

-- ── 5g. Menu Items – Footer Navigation ──────────────────────
INSERT INTO public.menu_items (menu_id, label, type, page_id, category_id, url, display_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'Home',                'page',        'b0000000-0000-0000-0000-000000000001', NULL,                      NULL, 1),
('a0000000-0000-0000-0000-000000000002', 'Shop',                'page',        'b0000000-0000-0000-0000-000000000004', NULL,                      NULL, 2),
('a0000000-0000-0000-0000-000000000002', 'About',               'page',        'b0000000-0000-0000-0000-000000000002', NULL,                      NULL, 3),
('a0000000-0000-0000-0000-000000000002', 'Contact',             'page',        'b0000000-0000-0000-0000-000000000003', NULL,                      NULL, 4),
('a0000000-0000-0000-0000-000000000002', 'Preserved Flowers',   'category',    NULL,                                     'c0000000-0000-0000-0000-000000000001', NULL, 5),
('a0000000-0000-0000-0000-000000000002', 'Jewellery',           'category',    NULL,                                     'c0000000-0000-0000-0000-000000000002', NULL, 6),
('a0000000-0000-0000-0000-000000000002', 'Home Decor',          'category',    NULL,                                     'c0000000-0000-0000-0000-000000000003', NULL, 7);

-- ── 5h. Homepage Sections ───────────────────────────────────
INSERT INTO public.page_sections
  (page_id, section_type, title, subtitle, content, display_order)
VALUES
-- 1. Hero
('b0000000-0000-0000-0000-000000000001', 'hero',
 'You Feel It, We Preserve It',
 'Handcrafted resin art that turns your most treasured memories into timeless keepsakes.',
 '{"cta_text": "Shop Now", "cta_link": "/shop"}'::jsonb,
 1),

-- 2. Features / USP
('b0000000-0000-0000-0000-000000000001', 'features',
 'Why Choose Creative Duo?',
 NULL,
 '{"items": [
    {"icon": "flower", "title": "Real Flowers Preserved", "description": "We use real flowers captured at their peak beauty."},
    {"icon": "hand", "title": "Handcrafted with Love", "description": "Every piece is made by hand with meticulous attention to detail."},
    {"icon": "shield", "title": "Lasting Quality", "description": "Premium-grade resin ensures your keepsake lasts a lifetime."},
    {"icon": "truck", "title": "Pan-India Shipping", "description": "We carefully package and ship to your doorstep across India."}
  ]}'::jsonb,
 2),

-- 3. Category Grid
('b0000000-0000-0000-0000-000000000001', 'category_grid',
 'Explore Our Collections',
 'Find the perfect piece for every occasion.',
 '{"show_all_link": "/shop", "show_all_text": "View All"}'::jsonb,
 3),

-- 4. Product Grid – Best Sellers
('b0000000-0000-0000-0000-000000000001', 'product_grid',
 'Best Sellers',
 'Our most loved resin creations.',
 '{"product_filter": "best_sellers", "count": 8, "show_all_link": "/shop", "show_all_text": "View All Products"}'::jsonb,
 4),

-- 5. Custom Order CTA
('b0000000-0000-0000-0000-000000000001', 'custom_order',
 'Have Something Special in Mind?',
 'We create bespoke resin pieces tailored to your vision. From preserving wedding bouquets to custom jewellery – let us bring your idea to life.',
 '{"cta_text": "Request a Custom Order", "cta_link": "/contact"}'::jsonb,
 5),

-- 6. Gallery
('b0000000-0000-0000-0000-000000000001', 'gallery',
 'Our Work in Action',
 'A glimpse into our studio and the art we create.',
 '{"columns": 3}'::jsonb,
 6),

-- 7. About
('b0000000-0000-0000-0000-000000000001', 'about',
 'Meet Creative Duo',
 'We are two passionate artists who believe that beauty should be preserved forever. What started as a hobby quickly became a calling – transforming flowers, memories, and moments into wearable and displayable art.',
 '{"cta_text": "Read Our Story", "cta_link": "/about"}'::jsonb,
 7),

-- 8. Reviews
('b0000000-0000-0000-0000-000000000001', 'reviews',
 'What Our Customers Say',
 NULL,
 '{"reviews": [
    {"name": "Priya S.", "rating": 5, "text": "Absolutely stunning piece! The flowers from my wedding bouquet look even more beautiful preserved in resin."},
    {"name": "Anjali M.", "rating": 5, "text": "The quality is outstanding. I ordered a pendant with my daughter''s first flowers and it''s become my most treasured possession."},
    {"name": "Rahul K.", "rating": 5, "text": "Amazing attention to detail. The custom order process was smooth and the result exceeded my expectations."}
  ]}'::jsonb,
 8),

-- 9. FAQ
('b0000000-0000-0000-0000-000000000001', 'faq',
 'Frequently Asked Questions',
 NULL,
 '{"items": [
    {"question": "How do I send my flowers to you?", "answer": "Once you place an order, we will share our shipping address. Pack your flowers in a dry paper towel inside an envelope and send them to us via any courier."},
    {"question": "How long does it take to make a piece?", "answer": "Most pieces take 2-3 weeks from the time we receive your flowers. Custom orders may take longer depending on complexity."},
    {"question": "Do you ship across India?", "answer": "Yes! We ship Pan-India. All orders are carefully packaged to ensure they reach you in perfect condition."},
    {"question": "Can I request a custom design?", "answer": "Absolutely! We love creating bespoke pieces. Reach out to us via the Contact page with your idea and we will get back to you."}
  ]}'::jsonb,
 9),

-- 10. Contact
('b0000000-0000-0000-0000-000000000001', 'contact',
 'Get in Touch',
 'Have a question, custom order request, or just want to say hello? We would love to hear from you.',
 '{"email": "hello@creativeduoresin.com", "social": {"instagram": "https://instagram.com/creativeduo.resin"}}'::jsonb,
 10);
