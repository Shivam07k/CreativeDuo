'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import type { Product } from '@/lib/types';

interface ProductResponse {
  data: Product & {
    category?: { slug: string; name: string } | null;
  };
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-lg ${i < stars ? 'text-accent' : 'text-muted/30'}`}
        >
          ★
        </span>
      ))}
      <span className="ml-2 text-sm text-muted">{rating || 5}</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ categorySlug: string; productSlug: string }>();
  const { categorySlug, productSlug } = params;

  const [product, setProduct] = useState<(Product & { category?: { slug: string; name: string } | null }) | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setActiveImage(0);

    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError(false);

      try {
        const res = await fetchAPI<ProductResponse>(
          `/api/products/${encodeURIComponent(productSlug)}`,
        );
        if (!cancelled) {
          setProduct(res.data);
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

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productSlug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-lavender-light" />
          <div className="space-y-6">
            <div className="h-8 w-1/2 animate-pulse rounded bg-lavender-light" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-lavender-light" />
            <div className="h-6 w-1/4 animate-pulse rounded bg-lavender-light" />
            <div className="h-24 animate-pulse rounded bg-lavender-light" />
            <div className="h-12 w-40 animate-pulse rounded bg-lavender-light" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center lg:px-8">
        <h1 className="mb-4 font-heading text-4xl font-semibold text-text">
          Product not found
        </h1>
        <p className="mb-8 text-muted">
          The product you are looking for could not be found.
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

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: null as string | null, alt: product.name, display_order: 0 }];
  const active = images[Math.min(activeImage, images.length - 1)];
  const stars = Number(product.metadata?.rating) || 5;
  const category = product.category;
  const categorySlugForLink = category?.slug || categorySlug;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <nav className="mb-8 text-sm text-muted">
        <Link href="/shop" className="hover:text-primary">
          Shop
        </Link>
        {category && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/shop/${category.slug}`}
              className="hover:text-primary"
            >
              {category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-text">{product.name}</span>
      </nav>

      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div>
          <div className="mb-4 aspect-square overflow-hidden rounded-2xl bg-lavender-light">
            {active?.url ? (
              <img
                src={active.url}
                alt={active.alt || product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-script text-6xl text-primary/40">✦</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`aspect-square overflow-hidden rounded-xl bg-lavender-light transition-all ${
                    index === activeImage
                      ? 'ring-2 ring-secondary'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-script text-2xl text-primary/40">
                        ✦
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {category && (
            <Link
              href={`/shop/${category.slug}`}
              className="inline-block rounded-full bg-lavender-light px-4 py-1.5 text-xs font-medium text-secondary hover:bg-blush"
            >
              {category.name}
            </Link>
          )}

          <h1 className="font-heading text-4xl font-semibold text-text lg:text-5xl">
            {product.name}
          </h1>

          <StarRating rating={stars} />

          <p className="text-3xl font-semibold text-text">
            ₹{product.price.toLocaleString('en-IN')}
          </p>

          {product.description && (
            <div className="prose max-w-none text-muted">
              <p className="whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 border-t border-primary/10 pt-6">
            <button
              onClick={() => alert(`${product.name} added to cart`)}
              className="rounded-full bg-secondary px-10 py-3.5 font-heading text-lg font-semibold text-white transition-colors hover:bg-primary"
            >
              ADD +
            </button>
            <Link
              href={`/shop/${categorySlugForLink}`}
              className="rounded-full border border-secondary px-8 py-3.5 font-heading text-lg font-semibold text-secondary transition-colors hover:bg-lavender-light"
            >
              Back to {category?.name || 'Category'}
            </Link>
          </div>

          {product.metadata && Object.keys(product.metadata).length > 0 && (
            <div className="space-y-2 border-t border-primary/10 pt-6 text-sm">
              {Object.entries(product.metadata)
                .filter(([key]) => key !== 'rating')
                .map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-medium capitalize text-text">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-muted">{String(value)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
