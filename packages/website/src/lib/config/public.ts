import type { Locale } from "@/lib/i18n/locales";

const FALLBACK_DOCS_URL = "https://github.com/gaialynk/gaialynk.com";

export function getDocsBaseUrl(): string {
  return process.env.NEXT_PUBLIC_DOCS_URL || FALLBACK_DOCS_URL;
}

export function buildDocsUrl(locale: Locale): string {
  const url = new URL(getDocsBaseUrl());
  url.searchParams.set("utm_source", "website");
  url.searchParams.set("utm_medium", "entry");
  url.searchParams.set("utm_campaign", "phase1");
  url.searchParams.set("utm_content", `${locale}_docs_entry`);
  return url.toString();
}
