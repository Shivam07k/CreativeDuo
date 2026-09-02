'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import type { Product, Category } from '@/lib/types';

interface CategoryResponse {
  data: Category & { products: Product[] };
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-sm ${i < stars ? 'text-accent' : 'text-muted/30'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams<{ categorySlug: string }>();
  const categorySlug = params.categorySlug;

  const [category, setCategory] = useState<(Category & { products: Product[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategory() {
      setLoading(true);
      setError(false);

      try {
        const res = await fetchAPI<CategoryResponse>(
          `/api/categories/${encodeURIComponent(categorySlug)}`,
        );
        if (!cancelled) {
          setCategory(res.data);
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

    loadCategory();

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl animate-pulse text-center">
          <div className="mx-auto mb-6 h-48 w-full max-w-md rounded-2xl bg-lavender-light" />
          <div className="mx-auto mb-4 h-8 w-1/2 rounded bg-lavender-light" />
          <div className="mx-auto h-4 w-2/3 rounded bg-lavender-light" />
        </div>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-light">
              <div className="aspect-square bg-lavender-light" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-2/3 rounded bg-lavender-light" />
                <div className="h-4 w-1/2 rounded bg-lavender-light" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center lg:px-8">
        <h1 className="mb-4 font-heading text-4xl font-semibold text-text">
          Category not found
        </h1>
        <p className="mb-8 text-muted">
          The category you are looking for could not be found.
        </p>
        <Link
          href="/shop"
          className="inline-block rounded-md bg-secondary px-6 py-3 text-xs font-semibold tracking-widest text-white hover:bg-primary"
        >
          BACK TO SHOP
        </Link>
      </div>
    );
  }

  const products = (category.products || []).filter((p) => p.is_visible);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-12 lg:px-8">
        <nav className="mb-6 text-sm text-muted">
          <Link href="/shop" className="hover:text-primary">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">{category.name}</span>
        </nav>

        <div className="mb-12 overflow-hidden rounded-2xl bg-light">
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-[4/3] md:aspect-auto">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-lavender-light">
                  <span className="font-script text-6xl text-primary/40">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="mb-2 font-script text-3xl text-primary">Category</p>
              <h1 className="mb-4 font-heading text-4xl font-semibold text-text lg:text-5xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-muted">{category.description}</p>
              )}
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <p className="pb-20 text-center text-muted">
            No products in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 pb-20 lg:grid-cols-4">
            {products.map((product) => {
              const productImage = product.images?.[0]?.url || null;
              const stars = Number(product.metadata?.rating) || 5;

              return (
                <Link
                  key={product.id}
                  href={`/shop/${categorySlug}/${product.slug}`}
                  className="group overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden bg-lavender-light">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={product.images?.[0]?.alt || product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-script text-4xl text-primary/40">
                          ✦
                        </span>
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-secondary backdrop-blur">
                      {category.name}
                    </span>
                  </div>

                  <div className="space-y-2 p-5">
                    <h3 className="truncate font-heading text-lg font-semibold text-text group-hover:text-primary">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <StarRating rating={stars} />
                      <span className="text-xs text-muted">({stars})</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-lg font-semibold text-text">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-white transition-colors group-hover:bg-primary">
                        +
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
