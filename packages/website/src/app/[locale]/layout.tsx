import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDictionary } from "@/content/dictionaries";
import { PageShell } from "@/components/page-shell";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const dict = getDictionary(locale);
  return {
    title: dict.home.seoTitle,
    description: dict.home.seoDescription,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        "zh-Hant": "/zh-Hant",
        "zh-Hans": "/zh-Hans",
      },
    },
    openGraph: {
      title: dict.home.seoTitle,
      description: dict.home.seoDescription,
      type: "website",
      locale,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <PageShell locale={locale}>{children}</PageShell>;
}
