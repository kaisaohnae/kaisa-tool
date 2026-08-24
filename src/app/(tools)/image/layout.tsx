import CategorySubnav from '@/components/layout/category-subnav';

export default function ImageLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      <CategorySubnav category="image" />
      <div className="site-shell">
        <div className="site-shell__inner site-main__body">{children}</div>
      </div>
    </>
  );
}
