import { useSyncExternalStore } from 'react';

/**
 * Whether a media query matches, kept current. `serverValue` is what the
 * static shell assumes before the browser answers.
 */
export const useMediaQuery = (query: string, serverValue = false): boolean =>
  useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
