import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SectionRenderer from '@/components/sections/SectionRenderer';
import type { Page } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Props = { params: { pageSlug: string } };

interface PageResponse {
  data: Page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(`${API}/api/pages/${params.pageSlug}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Page Not Found' };
    const { data } = (await res.json()) as PageResponse;
    return {
      title: data.meta_title || data.title,
      description: data.meta_description || '',
    };
  } catch {
    return { title: 'Page Not Found' };
  }
}

export default async function DynamicPage({ params }: Props) {
  let page: Page | undefined;
  try {
    const res = await fetch(`${API}/api/pages/${params.pageSlug}`, { cache: 'no-store' });
    if (!res.ok) notFound();
    const json = (await res.json()) as PageResponse;
    page = json.data;
  } catch {
    notFound();
  }

  if (!page || !page.is_visible) notFound();

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <h1 className="font-heading text-4xl font-semibold text-text lg:text-5xl">
          {page.title}
        </h1>
      </div>
      {page.sections
        ?.filter((s) => s.is_visible)
        ?.sort((a, b) => a.display_order - b.display_order)
        .map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
    </div>
  );
}
