/** Renders JSON-LD for crawlers (included in SSG HTML). */
export default function JsonLd({data}: {data: Record<string, unknown> | null}) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: JSON.stringify(data)}}
    />
  );
}
