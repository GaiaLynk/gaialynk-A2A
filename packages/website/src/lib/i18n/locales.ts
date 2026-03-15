export const SUPPORTED_LOCALES = ["en", "zh-Hant", "zh-Hans"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  if (isSupportedLocale(value)) {
    return value;
  }

  const lower = value.toLowerCase();
  if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower.startsWith("zh-mo")) {
    return "zh-Hant";
  }

  if (lower.startsWith("zh")) {
    return "zh-Hans";
  }

  return DEFAULT_LOCALE;
}
