'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';

/** The rendered width of an element, kept current as it resizes (charts draw to real pixels). */
export const useElementWidth = <T extends HTMLElement>(): [RefObject<T | null>, number] => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setWidth(Math.floor(entry.contentRect.width));
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
};
