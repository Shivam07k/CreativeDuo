'use client';

interface GalleryImage {
  url: string;
  alt?: string;
}

interface GallerySectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    images?: GalleryImage[];
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

export default function GallerySection({
  title,
  subtitle,
  content,
  background_color,
  text_color,
}: GallerySectionProps) {
  const images = content.images || [];

  const heightVariants = [
    'row-span-2',
    'col-span-2',
    'row-span-1',
    'row-span-1',
    'col-span-2',
    'row-span-2',
  ];

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
          <div className="grid auto-rows-[200px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image, index) => (
              <figure
                key={index}
                className={`group relative overflow-hidden rounded-2xl ${
                  heightVariants[index % heightVariants.length]
                }`}
              >
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.alt || ''}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-lavender-light">
                    <span className="font-script text-5xl text-primary/40">
                      ✦
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
