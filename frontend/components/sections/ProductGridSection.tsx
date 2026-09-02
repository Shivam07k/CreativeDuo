'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import type { Product } from '@/lib/types';

interface ProductGridSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    product_ids?: string[];
    show_featured?: boolean;
    category_slug?: string;
    limit?: number;
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

interface ProductsResponse {
  data: Product[];
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

export default function ProductGridSection({
  title,
  subtitle,
  content,
  background_color,
  text_color,
}: ProductGridSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError(false);

      try {
        const limit = content.limit || 8;
        let response: ProductsResponse;

        if (content.product_ids && content.product_ids.length > 0) {
          response = await fetchAPI<ProductsResponse>(
            `/api/products?ids=${encodeURIComponent(content.product_ids.join(','))}`,
          );
        } else if (content.category_slug) {
          response = await fetchAPI<ProductsResponse>(
            `/api/products?category=${encodeURIComponent(content.category_slug)}&limit=${limit}`,
          );
        } else if (content.show_featured) {
          response = await fetchAPI<ProductsResponse>(
            `/api/products?featured=true&limit=${limit}`,
          );
        } else {
          response = await fetchAPI<ProductsResponse>(
            `/api/products?limit=${limit}`,
          );
        }

        if (!cancelled) {
          setProducts(response.data || []);
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

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [
    content.product_ids,
    content.category_slug,
    content.show_featured,
    content.limit,
  ]);

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
                  <div className="h-4 w-1/2 rounded bg-lavender-light" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="py-10 text-center text-muted">
            Unable to load products right now. Please try again later.
          </p>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="py-10 text-center text-muted">
            No products available at this time.
          </p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {products.map((product) => {
              const productImage = product.images?.[0]?.url || null;
              const productCategorySlug = product.category_slug || '';
              const stars = Number(product.metadata?.rating) || 5;

              return (
                <Link
                  key={product.id}
                  href={`/shop/${productCategorySlug}/${product.slug}`}
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
                    {product.category_name && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-secondary backdrop-blur">
                        {product.category_name}
                      </span>
                    )}
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
    </section>
  );
}
