# Creative Duo Resin & Co. — CMS + E-commerce Platform

A fully dynamic, admin-controlled platform for a resin art store. Every element — colors, fonts,
images, navigation menus, pages, sections, categories, and products — is editable from an Admin
Panel and reflected on the public site instantly. No code changes or redeploys required.

## Architecture

```
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│  Next.js 14 (Render)    │ ───► │  Node.js/Express (Render│ ───► │  Supabase               │
│  App Router + Tailwind  │ HTTP │  Web Service)           │  SQL │  Postgres + Auth +      │
│                         │      │  JWT admin auth         │      │  Storage                │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

- **Frontend** (`frontend/`): Next.js 14 App Router, TypeScript, Tailwind. All data comes from the
  backend API — the frontend never talks to Supabase directly.
- **Backend** (`backend/`): Express + TypeScript. Owns all Supabase interactions (Postgres, Auth,
  Storage). Exposes public endpoints plus authenticated admin CRUD endpoints.
- **Deployment**: Frontend → Render Web Service, backend → Render Web Service (see `render.yaml`).

Content changes (colors, menus, products, sections, settings) reflect on the public site
immediately because public fetches use `cache: 'no-store'`.

---

## 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. From **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **Service role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
3. From **Project Settings → Storage**, note the bucket URL. The SQL below creates the
   `resin-art-assets` storage bucket automatically.

## 2. Run the SQL schema

1. Open **SQL Editor** in your Supabase dashboard.
2. Open `backend/schema.sql` and copy the entire contents.
3. Run it. This creates all tables, RLS policies, the storage bucket, and seed data
   (brand colors, fonts, menus, pages, page sections, categories, products, and site settings).

## 3. Create the first admin user

The admin panel authenticates against Supabase Auth and checks the `admin_profiles` table.
Create your first admin by running this in the Supabase **SQL Editor** (replace the email/password):

```sql
-- 1. Create the auth user
select id, email from auth.users
where email = 'admin@example.com';

-- If the user does not exist, create one (email + password):
--   Sign up via Authentication → Users → Add user (email + temporary password),
--   then have them sign in once, or use the Sign Up endpoint.

-- 2. After the user exists, insert into admin_profiles using their generated id:
insert into public.admin_profiles (id, email, role)
select id, email, 'super_admin'
from auth.users
where email = 'admin@example.com'
on conflict (id) do nothing;
```

Alternatively, do both steps in one block after creating the user:

```sql
insert into public.admin_profiles (id, email, role)
select id, email, 'super_admin'
from auth.users
where email = 'admin@example.com';
```

> Any user with a row in `admin_profiles` whose `role` is `admin` or `super_admin` can sign in at
> `/admin/login`. All `/api/admin/*` routes enforce this via the `verifyAdmin` middleware, which
> validates the user's Supabase access token and checks their profile.

## 4. Configure and run the backend

```bash
cd backend
cp .env.example .env       # then edit with your Supabase credentials
npm install
npm run dev                # starts on http://localhost:4000
```

`.env`:

```
SUPABASE_URL=<your-project-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

Verify it is running: `GET http://localhost:4000/api/settings` should return the seeded settings.

## 5. Configure and run the frontend

```bash
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL if needed
npm install
npm run dev                        # starts on http://localhost:3000
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 6. Everything works

- **Public site**: `http://localhost:3000` — hero, menus, category/product grids, pages, footer.
- **Admin panel**: `http://localhost:3000/admin` → sign in with your admin email/password.  - Dashboard with quick stats
  - **Design** — edit colors (`--color-[primary|secondary|accent|background|text]`) and fonts
    (`--font-[heading|body|script]`). Changes apply site-wide instantly.
  - **Menus** — manage `main`/`footer` menus, add page/category/custom-link items, reorder.
  - **Pages** — create/edit pages, manage page sections (Hero, Features, Text, ImageGrid,
    ProductGrid, CategoryGrid, FAQ, Reviews, Gallery, CustomOrder, CustomHtml).
  - **Categories** — add/edit categories with display order and visibility.
  - **Products** — full product management with multiple images, price, currency, metadata,
    featured flag, ordering.
  - **Settings** — brand name, tagline, logo, contact email, WhatsApp, Instagram, footer text,
    copyright.

## 7. Deploy to Render

The repo ships with a `render.yaml` blueprint. When you connect the GitHub repo in Render
(**New → Blueprint**), it creates both services and sets `rootDir`/build/start commands for you.

### Backend — `creative-duo-api` (Web Service)

1. After the blueprint creates it, open the service → **Environment**.
2. Set these env vars:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — your Supabase **service role** key (secret)
   - `CORS_ORIGIN` — comma-separated list of allowed origins, e.g.
     `https://creative-duo-web.onrender.com,http://localhost:3000`
3. Render sets `PORT` automatically, so the Express server binds correctly.
4. Note the service URL, e.g. `https://creative-duo-api.onrender.com` — used by the frontend.

### Frontend — `creative-duo-web` (Web Service)

> The frontend uses Next.js dynamic routes and server components that fetch at request time, so it
> must run as a **Node Web Service** (`npm run build` + `npm start`), **not** a static site.

1. In the service → **Environment**, set:
   - `NEXT_PUBLIC_API_URL` to the backend URL from above, e.g.
     `https://creative-duo-api.onrender.com`
2. Deploy. The public site is now live at e.g. `https://creative-duo-web.onrender.com`.

> Render's free tier spins services down when idle. Ignore the ~50s cold-start the first time you
> load after inactivity.

## API Overview (backend)

Public (no auth):

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/settings` | Site settings as `{ key: value }` map |
| GET | `/api/design-tokens` | Active design tokens (`type`, `key`, `value`) |
| GET | `/api/menus/:location` | Menu with items resolved to page/category targets |
| GET | `/api/pages/:slug` | Page + visible sections |
| GET | `/api/categories` | Visible categories |
| GET | `/api/categories/:slug` | Category + its visible products |
| GET | `/api/products` | Visible products. Params: `category`, `featured=true`, `limit`, `ids` (comma-separated) |
| GET | `/api/products/:slug` | Single product with its category |
| POST | `/api/auth/login` | Admin login (returns `{ token, user }`) |

Admin (all require `Authorization: Bearer <token>` from login):

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/admin/me` | Current admin profile |
| CRUD | `/api/admin/design-tokens` | Design token management |
| CRUD | `/api/admin/menus` | Menu management |
| CRUD | `/api/admin/menu-items` | Menu item management (with `page_title`/`category_slug` enrichment) |
| CRUD | `/api/admin/pages` | Page management |
| CRUD | `/api/admin/page-sections` | Page section management |
| CRUD | `/api/admin/categories` | Category management |
| CRUD | `/api/admin/products` | Product management |
| PUT | `/api/admin/settings` | Bulk update site settings |
| POST | `/api/admin/upload` | Upload a file (multipart `file` + `folder`) to storage, returns `{ url }` |

## Project structure

```
nextgo/
├─ backend/
│  ├─ schema.sql                 # Authoritative schema + seed (tables, RLS, bucket)
│  └─ src/
│     ├─ index.ts                # Express entry, CORS, multer, error handler
│     ├─ supabase.ts             # Supabase client (service role)
│     ├─ middleware/auth.ts      # verifyAdmin (Supabase token + admin_profiles check)
│     ├─ routes/
│     │  ├─ auth.ts              # login / me
│     │  ├─ public.ts            # public endpoints
│     │  └─ admin/               # admin CRUD routers
│     └─ types/                  # shared backend types
└─ frontend/
   ├─ app/
   │  ├─ layout.tsx              # Server layout: tokens → CSS vars, menus, settings
   │  ├─ page.tsx                # Homepage
   │  ├─ [pageSlug]/page.tsx     # CMS pages
   │  ├─ shop/                   # Shop, category, product pages
   │  └─ admin/                  # Admin panel (login, dashboard, modules)
   ├─ components/
   │  ├─ Navbar.tsx, Footer.tsx
   │  └─ sections/               # 12 section renderers
   └─ lib/
      ├─ api.ts                  # typed fetch client (fetchAPI/postAPI/putAPI/deleteAPI/uploadFile)
      └─ types.ts                # frontend API types
```

## Extending

- **New section type**: add a renderer in `frontend/components/sections/`, wire it into the
  `SectionRenderer` switch, and the Sections admin editor will pass through its `content` JSON.
- **Cart/checkout**: add tables (orders, order_items, carts) in `schema.sql` plus admin/public
  routes; the products API already returns full product data needed to build a cart UI.
- **Analytics**: add a `page_views` table and an ingestion route; the backend is already
  Supabase-ready.
- **SEO**: `pages.meta_title` / `pages.meta_description` are already surfaced by
  `/api/pages/:slug`; wire them into `generateMetadata` in `app/[pageSlug]/page.tsx`.

## Notes

- The storage bucket is `resin-art-assets`; uploads go under `uploads/`, `products/`,
  `categories/`, `settings/`, or `sections/` (the `folder` field sent by the admin UI).
- Public endpoints filter on visibility flags (`is_visible`), so hiding/archiving content in the
  admin panel removes it from the public site without deleting data.