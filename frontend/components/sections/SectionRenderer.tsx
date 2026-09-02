'use client';

import type { PageSection } from '@/lib/types';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import TextBlockSection from './TextBlockSection';
import ImageGridSection from './ImageGridSection';
import ProductGridSection from './ProductGridSection';
import CategoryGridSection from './CategoryGridSection';
import FaqSection from './FaqSection';
import ReviewsSection from './ReviewsSection';
import GallerySection from './GallerySection';
import CustomOrderSection from './CustomOrderSection';
import CustomHtmlSection from './CustomHtmlSection';

interface SectionRendererProps {
  section: PageSection;
}

const componentMap: Record<string, (props: any) => JSX.Element | null> = {
  hero: HeroSection,
  features: FeaturesSection,
  text_block: TextBlockSection,
  image_grid: ImageGridSection,
  product_grid: ProductGridSection,
  category_grid: CategoryGridSection,
  faq: FaqSection,
  reviews: ReviewsSection,
  gallery: GallerySection,
  custom_order: CustomOrderSection,
  custom_html: CustomHtmlSection,
};

export default function SectionRenderer({ section }: SectionRendererProps) {
  const Component = componentMap[section.section_type];

  if (!Component || !section.is_visible) {
    return null;
  }

  const sectionProps = {
    title: section.title,
    subtitle: section.subtitle,
    content: section.content || {},
    image_url: section.image_url,
    background_color: section.background_color,
    text_color: section.text_color,
  };

  return (
    <div
      className="section"
      data-section-id={section.id}
      data-section-type={section.section_type}
    >
      <Component {...sectionProps} />
    </div>
  );
}
