'use client';

import {useEffect} from 'react';
import useThemeStore from '@/store/use-theme-store';

export default function ThemeProvider() {
  const initTheme = useThemeStore(s => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return null;
}
