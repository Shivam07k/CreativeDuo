import SectionRenderer from '@/components/sections/SectionRenderer';
import type { Page } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface PageResponse {
  data: Page;
}

export default async function HomePage() {
  let page: Page | undefined;
  try {
    const res = await fetch(`${API}/api/pages/home`, { cache: 'no-store' });
    if (res.ok) {
      const json = (await res.json()) as PageResponse;
      page = json.data;
    }
  } catch {}

  if (page && page.is_visible) {
    return (
      <div>
        {page.sections
          ?.filter((s) => s.is_visible)
          ?.sort((a, b) => a.display_order - b.display_order)
          .map((section) => (
            <SectionRenderer key={section.id} section={section} />
          ))}
      </div>
    );
  }

  // Fallback if no home page configured
  return (
    <div>
      {/* Basic hero fallback */}
      <section
        className="flex min-h-[70vh] items-center justify-center px-6 text-center"
        style={{
          background:
            'linear-gradient(135deg, var(--color-background), var(--color-lavender-light, #eee4f3))',
        }}
      >
        <div>
          <p
            className="mb-2 text-4xl"
            style={{
              fontFamily: 'var(--font-script)',
              color: 'var(--color-secondary)',
            }}
          >
            Handcrafted ♡
          </p>
          <h1
            className="mb-6 text-6xl font-light md:text-8xl"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-text)',
            }}
          >
            Resin
            <br />
            <span
              style={{
                color: 'var(--color-secondary)',
                fontStyle: 'italic',
              }}
            >
              Creations
            </span>
          </h1>
          <p className="mb-8 text-lg" style={{ color: 'var(--color-muted)' }}>
            Thoughtfully handmade pieces to celebrate every little memory.
          </p>
          <a
            href="/shop"
            className="inline-block rounded-md px-8 py-3 text-xs font-semibold tracking-widest text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            SHOP NOW
          </a>
        </div>
      </section>
    </div>
  );
}
