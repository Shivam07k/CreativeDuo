'use client';

interface ReviewItem {
  quote: string;
  author: string;
  rating?: number;
}

interface ReviewsSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    items?: ReviewItem[];
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
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

export default function ReviewsSection({
  title,
  subtitle,
  content,
  background_color,
  text_color,
}: ReviewsSectionProps) {
  const items = content.items || [];

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

        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col rounded-2xl border border-primary/10 bg-white p-8 shadow-sm"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-lavender-light">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-primary"
                    aria-hidden="true"
                  >
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                  </svg>
                </div>

                {typeof item.rating === 'number' && item.rating > 0 && (
                  <div className="mb-4">
                    <StarRating rating={item.rating} />
                  </div>
                )}

                <blockquote className="flex-1 text-base leading-relaxed text-text">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>

                <footer className="mt-6 border-t border-primary/10 pt-5">
                  <p className="font-heading text-lg font-semibold text-secondary">
                    {item.author}
                  </p>
                </footer>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
