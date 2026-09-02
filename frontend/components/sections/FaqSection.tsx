'use client';

import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    items?: FaqItem[];
  };
  image_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

export default function FaqSection({
  title,
  subtitle,
  content,
  background_color,
  text_color,
}: FaqSectionProps) {
  const items = content.items || [];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      className="py-20"
      style={{
        backgroundColor: background_color || undefined,
        color: text_color || undefined,
      }}
    >
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-14 text-center">
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
          <div className="space-y-4">
            {items.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-heading text-lg font-semibold text-text">
                      {item.question}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender-light text-secondary transition-transform duration-300 ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 pb-5">
                        <p className="text-sm leading-relaxed text-muted">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
