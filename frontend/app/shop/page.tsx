'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import type { Product, Category } from '@/lib/types';

interface ProductsResponse {
  data: Product[];
}

interface CategoriesResponse {
  data: Category[];
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

function ProductCard({ product }: { product: Product }) {
  const productImage = product.images?.[0]?.url || null;
  const categorySlug = product.category_slug || '';
  const stars = Number(product.metadata?.rating) || 5;

  return (
    <Link
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
            <span className="font-script text-4xl text-primary/40">✦</span>
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
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(false);

      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetchAPI<ProductsResponse>('/api/products'),
          fetchAPI<CategoriesResponse>('/api/categories'),
        ]);

        if (!cancelled) {
          setProducts(productsRes.data || []);
          setCategories(categoriesRes.data || []);
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

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts =
    activeCategory === null
      ? products
      : products.filter((p) => p.category_slug === activeCategory);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-10 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 font-script text-3xl text-primary">Our Collection</p>
          <h1 className="font-heading text-4xl font-semibold text-text lg:text-6xl">
            Shop
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {categories.length > 0 && (
          <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-secondary text-white'
                  : 'bg-light text-muted hover:bg-lavender-light'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.slug)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category.slug
                    ? 'bg-secondary text-white'
                    : 'bg-light text-muted hover:bg-lavender-light'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 gap-6 pb-20 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
          <p className="pb-20 text-center text-muted">
            Unable to load products right now. Please try again later.
          </p>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <p className="pb-20 text-center text-muted">
            No products available at this time.
          </p>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-6 pb-20 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
