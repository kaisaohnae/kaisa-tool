'use client';

import Link from 'next/link';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

/** Client redirect with a crawlable fallback link for static export. */
export default function Redirect({href}: {href: string}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return (
    <p className="tool-status" style={{textAlign: 'center', margin: '40px 0'}}>
      <Link href={href}>Continue</Link>
    </p>
  );
}
