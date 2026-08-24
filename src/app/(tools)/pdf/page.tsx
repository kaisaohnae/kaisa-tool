import type {Metadata} from 'next';
import Link from 'next/link';
import {getCategory, getToolsByCategory} from '@/data/tools';

export const metadata: Metadata = {
  title: 'PDF'
};

export default function PdfIndexPage() {
  const category = getCategory('pdf');
  const tools = getToolsByCategory('pdf');

  return (
    <section className="category-index">
      <h1 className="category-index__title">{category.label}</h1>
      <p className="category-index__desc">{category.description}</p>
      <div className="category-index__list">
        {tools.map(tool => (
          <Link key={tool.id} href={tool.href} className="category-index__item">
            <strong>{tool.title}</strong>
            <span>{tool.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
