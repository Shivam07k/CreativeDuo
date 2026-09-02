'use client';

interface ImageItem {
  url: string;
  alt?: string;
  caption?: string;
}

interface ImageGridSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    images?: ImageItem[];
    columns?: number;
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

export default function ImageGridSection({
  title,
  subtitle,
  content,
  background_color,
  text_color,
}: ImageGridSectionProps) {
  const images = content.images || [];
  const columns = content.columns || 3;

  const columnClass: Record<number, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };

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

        {images.length > 0 && (
          <div className={`grid grid-cols-1 gap-6 ${columnClass[columns] || 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {images.map((image, index) => (
              <figure
                key={index}
                className="group relative overflow-hidden rounded-2xl shadow-md"
              >
                <div className="aspect-square overflow-hidden bg-lavender-light">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.alt || ''}
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
                </div>
                {image.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10">
                    <p className="text-sm font-medium text-white">
                      {image.caption}
                    </p>
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
