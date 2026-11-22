import { DARK_QUERY, THEME_STORAGE_KEY } from './theme.constants';

/**
 * Runs in <head> before first paint (Next.js "preventing flash before
 * hydration" pattern), so a saved dark preference never flashes light.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('${DARK_QUERY}').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;
