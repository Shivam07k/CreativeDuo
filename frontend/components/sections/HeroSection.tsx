'use client';

import Link from 'next/link';

interface HeroSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    headline?: string;
    subtext?: string;
    cta_text?: string;
    cta_link?: string;
    secondary_cta_text?: string;
    secondary_cta_link?: string;
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

export default function HeroSection({
  title,
  subtitle,
  content,
  image_url,
  background_color,
  text_color,
}: HeroSectionProps) {
  return (
    <section
      className="relative min-h-[80vh] flex items-center overflow-hidden"
      style={{
        backgroundColor: background_color || undefined,
        color: text_color || undefined,
        backgroundImage: !background_color
          ? 'linear-gradient(135deg, var(--color-lavender-light) 0%, var(--color-blush) 50%, var(--color-light) 100%)'
          : undefined,
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            {(title || subtitle) && (
              <div className="space-y-2">
                {subtitle && (
                  <p className="font-script text-3xl text-primary lg:text-4xl">
                    {subtitle}
                  </p>
                )}
                {title && (
                  <h1 className="font-heading text-5xl font-semibold leading-tight tracking-tight text-text lg:text-7xl">
                    {title}
                  </h1>
                )}
              </div>
            )}

            {content.headline && (
              <h2 className="font-heading text-3xl font-medium text-text lg:text-4xl">
                {content.headline}
              </h2>
            )}

            {content.subtext && (
              <p className="max-w-lg text-lg leading-relaxed text-muted">
                {content.subtext}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4">
              {content.cta_text && content.cta_link && (
                <Link
                  href={content.cta_link}
                  className="inline-flex items-center rounded-full bg-secondary px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-primary hover:shadow-lg"
                >
                  {content.cta_text}
                </Link>
              )}
              {content.secondary_cta_text && content.secondary_cta_link && (
                <Link
                  href={content.secondary_cta_link}
                  className="inline-flex items-center rounded-full border-2 border-secondary px-8 py-3.5 text-sm font-medium text-secondary transition-all hover:bg-secondary hover:text-white"
                >
                  {content.secondary_cta_text}
                </Link>
              )}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            {image_url ? (
              <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src={image_url}
                  alt={title || 'Hero image'}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/5" />
              </div>
            ) : (
              <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
                      <span className="font-script text-5xl text-primary">
                        ✦
                      </span>
                    </div>
                    <p className="font-script text-3xl text-primary/60">
                      Resin Art
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/5" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
