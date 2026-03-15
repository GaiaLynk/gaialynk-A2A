import type { Locale } from "@/lib/i18n/locales";

export type PageCopy = {
  title: string;
  description: string;
  primaryCta: string;
  seoTitle: string;
  seoDescription: string;
};

export type Dictionary = {
  localeLabel: string;
  nav: {
    developers: string;
    trust: string;
    useCases: string;
    docs: string;
    analytics: string;
  };
  home: PageCopy & {
    eyebrow: string;
    valuePoints: [string, string, string];
    evidenceTitle: string;
    evidenceDescription: string;
    evidencePoints: [string, string, string];
    secondaryCtas: {
      demo: string;
      waitlist: string;
    };
  };
  developers: PageCopy;
  trust: PageCopy;
  useCases: PageCopy;
  waitlist: PageCopy;
  demo: PageCopy;
  docs: PageCopy;
};

export type DictionaryMap = Record<Locale, Dictionary>;
