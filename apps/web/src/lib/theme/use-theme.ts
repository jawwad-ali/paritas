'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { ResolvedTheme, ThemePreference } from './theme.constants';
import { readPreference, resolveTheme, subscribeToTheme, writePreference } from './theme-store';

interface ThemeState {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const serverPreference = (): ThemePreference => 'system';

export const useTheme = (): ThemeState => {
  const preference = useSyncExternalStore(subscribeToTheme, readPreference, serverPreference);
  const resolvedTheme = useSyncExternalStore(
    subscribeToTheme,
    () => resolveTheme(readPreference()),
    () => 'light' as const,
  );
  const setPreference = useCallback((next: ThemePreference) => writePreference(next), []);
  return { preference, resolvedTheme, setPreference };
};
