import CategorySubnav from '@/components/layout/category-subnav';

export default function EditLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      <CategorySubnav category="edit" />
      <div className="site-shell">
        <div className="site-shell__inner site-main__body">{children}</div>
      </div>
    </>
  );
}
