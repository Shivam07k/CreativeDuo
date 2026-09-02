'use client';

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    items?: FeatureItem[];
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

export default function FeaturesSection({
  title,
  subtitle,
  content,
  background_color,
  text_color,
}: FeaturesSectionProps) {
  const items = content.items || [];

  return (
    <section
      className="py-24"
      style={{
        backgroundColor: background_color || undefined,
        color: text_color || undefined,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mx-auto mb-16 max-w-2xl text-center">
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
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-primary/10 bg-white p-8 text-center shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-lavender-light transition-colors group-hover:bg-primary/20">
                  <span className="text-3xl">{item.icon || '✦'}</span>
                </div>
                <h3 className="mb-3 font-heading text-xl font-semibold text-text">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
