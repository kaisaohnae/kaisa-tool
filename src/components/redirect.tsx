'use client';

import {useEffect} from 'react';

/** HTML refresh also redirects static exports before React hydrates. */
export default function Redirect({href}: {href: string}) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${href}`} />
      <p className="tool-status" style={{textAlign: 'center', margin: '40px 0'}}>
        <a href={href}>이동 중입니다. 자동으로 이동하지 않으면 여기를 클릭하세요.</a>
      </p>
    </>
  );
}
