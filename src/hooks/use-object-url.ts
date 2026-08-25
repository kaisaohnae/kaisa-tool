'use client';

import {useEffect, useState} from 'react';

/** Object URL lifecycle helper — revokes previous URL on change/unmount. */
export function useObjectUrl(blob: Blob | null | undefined): string {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  return url;
}
