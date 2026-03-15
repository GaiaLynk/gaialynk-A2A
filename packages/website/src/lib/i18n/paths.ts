import { DEFAULT_LOCALE, type Locale, normalizeLocale, SUPPORTED_LOCALES } from "./locales";

export function extractLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split("/").filter(Boolean);
  const head = segments[0];
  if (!head) {
    return null;
  }
  return SUPPORTED_LOCALES.includes(head as Locale) ? (head as Locale) : null;
}

export function withLocale(pathname: string, locale: Locale): string {
  const cleaned = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = cleaned.split("/").filter(Boolean);

  if (!segments.length) {
    return `/${locale}`;
  }

  if (SUPPORTED_LOCALES.includes(segments[0] as Locale)) {
    segments[0] = locale;
    return `/${segments.join("/")}`;
  }

  return `/${locale}/${segments.join("/")}`;
}

export function resolvePreferredLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (input.cookieLocale) {
    return normalizeLocale(input.cookieLocale);
  }

  if (input.acceptLanguage) {
    const first = input.acceptLanguage.split(",")[0]?.trim();
    return normalizeLocale(first);
  }

  return DEFAULT_LOCALE;
}
