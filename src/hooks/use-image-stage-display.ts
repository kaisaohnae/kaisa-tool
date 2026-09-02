import {useCallback, useEffect, useState, type RefObject} from 'react';

const MAX_HEIGHT_RATIO = 0.8;

export function fitImageToStage(
  natural: {width: number; height: number},
  containerWidth: number,
  maxHeight = window.innerHeight * MAX_HEIGHT_RATIO
): {width: number; height: number} {
  if (!natural.width || !containerWidth) return {width: 1, height: 1};
  const scale = Math.min(containerWidth / natural.width, maxHeight / natural.height);
  return {
    width: Math.max(1, Math.round(natural.width * scale)),
    height: Math.max(1, Math.round(natural.height * scale))
  };
}

export function useImageStageDisplay(
  wrapRef: RefObject<HTMLElement | null>,
  natural: {width: number; height: number}
) {
  const [display, setDisplay] = useState({width: 1, height: 1});

  const updateDisplaySize = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || !natural.width) return;
    const width = wrap.clientWidth || wrap.getBoundingClientRect().width;
    setDisplay(fitImageToStage(natural, width));
  }, [wrapRef, natural.width, natural.height]);

  useEffect(() => {
    updateDisplaySize();
    const wrap = wrapRef.current;
    if (!wrap) return;

    const observer = new ResizeObserver(updateDisplaySize);
    observer.observe(wrap);
    window.addEventListener('resize', updateDisplaySize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDisplaySize);
    };
  }, [wrapRef, updateDisplaySize]);

  return {display, updateDisplaySize};
}
