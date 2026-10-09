import en from './en.json';
import it from './it.json';

export const locales = ['en', 'it'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

const dictionaries = { en, it } as const;
export type Dictionary = typeof en;

/**
 * Public path of a page: no `.html`, no `index`, no trailing slash
 * (the build emits flat files like `it.html` and `projects/foo.html`).
 */
export function cleanPath(pathname: string): string {
  const p = pathname
    .replace(/\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export function getLocale(url: URL): Locale {
  const [, first] = cleanPath(url.pathname).split('/');
  return first === 'it' ? 'it' : 'en';
}

export function useTranslations(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Fill `{name}` placeholders in a UI string. */
export function fill(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

/** Localised path segments that differ between languages. */
const segments: Record<string, Record<Locale, string>> = {
  projects: { en: 'projects', it: 'progetti' },
};

/** Build a path for `locale` from a locale-neutral route like `/projects/foo`. */
export function localizedPath(route: string, locale: Locale): string {
  const parts = route.split('/').filter(Boolean);
  if (parts[0] && segments[parts[0]]) parts[0] = segments[parts[0]][locale];
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  const path = `${prefix}/${parts.join('/')}`;
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path || '/';
}

/** The same page in the other language (used by the language switch and hreflang). */
export function alternatePath(url: URL, target: Locale): string {
  const parts = cleanPath(url.pathname).split('/').filter(Boolean);
  if (parts[0] === 'it') parts.shift();
  // map localised segments back to the neutral route
  for (const [neutral, byLocale] of Object.entries(segments)) {
    if (Object.values(byLocale).includes(parts[0])) parts[0] = neutral;
  }
  return localizedPath(`/${parts.join('/')}`, target) + url.hash;
}
