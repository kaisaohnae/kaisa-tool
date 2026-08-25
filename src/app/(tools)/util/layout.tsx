import CategorySubnav from '@/components/layout/category-subnav';

export default function UtilLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      <CategorySubnav category="util" />
      <div className="site-shell">
        <div className="site-shell__inner site-main__body">{children}</div>
      </div>
    </>
  );
}
