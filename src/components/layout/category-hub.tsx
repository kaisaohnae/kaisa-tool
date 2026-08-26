import Link from 'next/link';
import JsonLd from '@/components/seo/json-ld';
import {getCategory, getToolsByCategory, type ToolCategory} from '@/data/tools';
import {categoryJsonLd} from '@/lib/seo';

export default function CategoryHub({category}: {category: ToolCategory}) {
  const cat = getCategory(category);
  const tools = getToolsByCategory(category);

  return (
    <section className="category-index">
      <JsonLd data={categoryJsonLd(category)} />
      <h1 className="category-index__title">{cat.label} tools</h1>
      <p className="category-index__desc">{cat.description}</p>
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
