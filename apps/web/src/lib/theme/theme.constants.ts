export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const isThemePreference = (value: string | null): value is ThemePreference =>
  value !== null && (THEME_PREFERENCES as readonly string[]).includes(value);

export const THEME_STORAGE_KEY = 'paritas-theme';
/** Fired on the window when the preference changes in this tab (storage events only cross tabs). */
export const THEME_CHANGE_EVENT = 'paritas-theme-change';
export const DARK_QUERY = '(prefers-color-scheme: dark)';

export const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'Match system',
};
