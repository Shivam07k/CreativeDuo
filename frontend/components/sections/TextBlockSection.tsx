interface TextBlockSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    html?: string;
    text?: string;
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

export default function TextBlockSection({
  title,
  subtitle,
  content,
  background_color,
  text_color,
}: TextBlockSectionProps) {
  return (
    <section
      className="py-20"
      style={{
        backgroundColor: background_color || undefined,
        color: text_color || undefined,
      }}
    >
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-12 text-center">
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

        {content.html ? (
          <div
            className="prose prose-lg max-w-none font-body text-text prose-headings:font-heading prose-headings:text-text prose-a:text-primary prose-strong:text-text"
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
        ) : content.text ? (
          <div className="space-y-4">
            {content.text.split('\n').map((paragraph, index) => (
              <p key={index} className="text-lg leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
