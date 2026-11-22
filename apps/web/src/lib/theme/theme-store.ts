import {
  DARK_QUERY,
  isThemePreference,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from './theme.constants';

/** Storage can throw (private mode, blocked site data); the default always works. */
export const readPreference = (): ThemePreference => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

export const resolveTheme = (preference: ThemePreference): ResolvedTheme => {
  if (preference !== 'system') {
    return preference;
  }
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
};

export const applyTheme = (preference: ThemePreference): void => {
  document.documentElement.classList.toggle('dark', resolveTheme(preference) === 'dark');
};

export const writePreference = (preference: ThemePreference): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Not persisted; the choice still applies to this page.
  }
  applyTheme(preference);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
};

/** Notifies on a preference change (this tab or another) and on an OS theme change. */
export const subscribeToTheme = (onChange: () => void): (() => void) => {
  const media = window.matchMedia(DARK_QUERY);
  const onSystemChange = (): void => {
    if (readPreference() === 'system') {
      applyTheme('system');
    }
    onChange();
  };
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  media.addEventListener('change', onSystemChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
    media.removeEventListener('change', onSystemChange);
  };
};
