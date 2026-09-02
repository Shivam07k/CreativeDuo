'use client';

interface CustomHtmlSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    html?: string;
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

export default function CustomHtmlSection({
  content,
  background_color,
  text_color,
}: CustomHtmlSectionProps) {
  if (!content.html) {
    return null;
  }

  return (
    <section
      className="mx-auto max-w-6xl px-6 py-12 lg:px-8"
      style={{
        backgroundColor: background_color || undefined,
        color: text_color || undefined,
      }}
    >
      <div
        className="custom-html"
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    </section>
  );
}
