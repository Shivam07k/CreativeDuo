'use client';

import Link from 'next/link';

interface OrderStep {
  number: string | number;
  title: string;
  description: string;
}

interface CustomOrderSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    headline?: string;
    description?: string;
    steps?: OrderStep[];
    cta_text?: string;
    cta_link?: string;
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

export default function CustomOrderSection({
  title,
  subtitle,
  content,
  background_color,
  text_color,
}: CustomOrderSectionProps) {
  const steps = content.steps || [];

  return (
    <section
      className="py-24"
      style={{
        backgroundColor: background_color || undefined,
        color: text_color || undefined,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="flex flex-col justify-center">
            {subtitle && (
              <p className="mb-3 font-script text-3xl text-primary">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="mb-6 font-heading text-4xl font-semibold leading-tight text-text lg:text-5xl">
                {title}
              </h2>
            )}
            {content.headline && (
              <h3 className="mb-4 font-heading text-2xl font-medium text-text">
                {content.headline}
              </h3>
            )}
            {content.description && (
              <p className="mb-8 max-w-md text-lg leading-relaxed text-muted">
                {content.description}
              </p>
            )}
            {content.cta_text && content.cta_link && (
              <Link
                href={content.cta_link}
                className="inline-flex w-fit items-center rounded-full bg-secondary px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-primary hover:shadow-lg"
              >
                {content.cta_text}
              </Link>
            )}
          </div>

          {steps.length > 0 && (
            <div className="space-y-8">
              {steps.map((step, index) => {
                const number = String(step.number || index + 1).padStart(2, '0');
                return (
                  <div key={index} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white text-lg font-semibold text-primary shadow-sm">
                        {number}
                      </div>
                      {index < steps.length - 1 && (
                        <div className="my-3 h-full w-px flex-1 bg-primary/20" />
                      )}
                    </div>
                    <div className="pt-2">
                      <h4 className="mb-2 font-heading text-xl font-semibold text-text">
                        {step.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-muted">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
