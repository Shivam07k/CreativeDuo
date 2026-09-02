'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import type { Category } from '@/lib/types';

interface CategoryGridSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    show_all?: boolean;
    category_ids?: string[];
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

interface CategoriesResponse {
  data: Category[];
}

export default function CategoryGridSection({
  title,
  subtitle,
  content,
  background_color,
  text_color,
}: CategoryGridSectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError(false);

      try {
        const response = await fetchAPI<CategoriesResponse>('/api/categories');

        if (!cancelled) {
          const all = response.data || [];
          if (content.category_ids && content.category_ids.length > 0) {
            setCategories(
              all.filter((c) => content.category_ids!.includes(c.id)),
            );
          } else {
            setCategories(all);
          }
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [content.category_ids]);

  return (
    <section
      className="py-20"
      style={{
        backgroundColor: background_color || undefined,
        color: text_color || undefined,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mx-auto mb-14 max-w-2xl text-center">
            {subtitle && (
              <p className="mb-3 font-script text-3xl text-primary">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="font-heading text-4xl font-semibold text-text lg:text-5xl">
                {title}
              </h2>
            )}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl bg-light"
              >
                <div className="aspect-square bg-lavender-light" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-lavender-light" />
                  <div className="h-4 w-1/3 rounded bg-lavender-light" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="py-10 text-center text-muted">
            Unable to load categories right now. Please try again later.
          </p>
        )}

        {!loading && !error && categories.length === 0 && (
          <p className="py-10 text-center text-muted">
            No categories available at this time.
          </p>
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop/${category.slug}`}
                className="group overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-lavender-light">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <span className="font-script text-5xl text-primary/40">
                        ✦
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <div className="flex items-center justify-between p-5">
                  <h3 className="font-heading text-xl font-semibold text-text group-hover:text-primary">
                    {category.name}
                  </h3>
                  <span className="text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
