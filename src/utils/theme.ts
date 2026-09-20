import { ThemeMode } from '../types';

/**
 * Checks if the system prefers dark mode via matchMedia.
 */
export function getSystemPrefersDark(): boolean {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

/**
 * Resolves effective boolean isDark based on theme mode.
 */
export function isDarkMode(theme: ThemeMode, systemDark?: boolean): boolean {
  if (theme === 'auto') {
    return systemDark !== undefined ? systemDark : getSystemPrefersDark();
  }
  return theme === 'dark';
}

/**
 * Cycles theme sequentially: Auto -> Light -> Dark -> Auto.
 */
export function cycleTheme(current: ThemeMode): ThemeMode {
  if (current === 'auto') return 'light';
  if (current === 'light') return 'dark';
  return 'auto';
}
