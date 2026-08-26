import Link from 'next/link';
import JsonLd from '@/components/seo/json-ld';
import {TOOL_CATEGORIES, getToolsByCategory} from '@/data/tools';
import {homeJsonLd} from '@/lib/seo';
import {SITE_DESCRIPTION, SITE_NAME} from '@/config/site';

export default function HomeHub() {
  return (
    <section className="home-hub">
      <JsonLd data={homeJsonLd()} />
      <header className="home-hub__intro">
        <h1 className="home-hub__title">{SITE_NAME}</h1>
        <p className="home-hub__desc">{SITE_DESCRIPTION}</p>
      </header>

      <div className="home-hub__categories">
        {TOOL_CATEGORIES.map(cat => {
          const tools = getToolsByCategory(cat.id);
          return (
            <section key={cat.id} className="home-hub__category" aria-labelledby={`cat-${cat.id}`}>
              <div className="home-hub__category-head">
                <h2 id={`cat-${cat.id}`} className="home-hub__category-title">
                  <Link href={`/${cat.id}/`}>{cat.label}</Link>
                </h2>
                <p className="home-hub__category-desc">{cat.description}</p>
              </div>
              <ul className="home-hub__tool-list">
                {tools.map(tool => (
                  <li key={tool.id}>
                    <Link href={tool.href} className="home-hub__tool-link">
                      <strong>{tool.title}</strong>
                      <span>{tool.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
