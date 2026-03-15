import { isSupportedLocale, type Locale } from "../i18n/locales";

export type LeadType = "waitlist" | "demo";

export type LeadInput = {
  type?: unknown;
  locale?: unknown;
  name?: unknown;
  email?: unknown;
  company?: unknown;
  useCase?: unknown;
};

export type ParsedLead = {
  type: LeadType;
  locale: Locale;
  name: string;
  email: string;
  company: string;
  useCase: string;
};

export function parseLeadInput(input: LeadInput): { ok: true; data: ParsedLead } | { ok: false; error: string } {
  const type = input.type === "waitlist" || input.type === "demo" ? input.type : null;
  if (!type) {
    return { ok: false, error: "Invalid lead type." };
  }

  const locale = typeof input.locale === "string" && isSupportedLocale(input.locale) ? input.locale : null;
  if (!locale) {
    return { ok: false, error: "Invalid locale." };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const company = typeof input.company === "string" ? input.company.trim() : "";
  const useCase = typeof input.useCase === "string" ? input.useCase.trim() : "";

  if (!name || !email || !company || !useCase) {
    return { ok: false, error: "Missing required fields." };
  }

  if (!email.includes("@")) {
    return { ok: false, error: "Invalid email." };
  }

  return {
    ok: true,
    data: {
      type,
      locale,
      name,
      email,
      company,
      useCase,
    },
  };
}
