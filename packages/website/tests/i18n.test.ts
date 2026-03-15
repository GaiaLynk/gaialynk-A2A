import { describe, expect, test } from "vitest";
import { normalizeLocale } from "../src/lib/i18n/locales";
import { resolvePreferredLocale, withLocale } from "../src/lib/i18n/paths";

describe("i18n locale utilities", () => {
  test("normalizes Traditional Chinese variants", () => {
    expect(normalizeLocale("zh-TW")).toBe("zh-Hant");
    expect(normalizeLocale("zh-HK")).toBe("zh-Hant");
  });

  test("normalizes generic zh to zh-Hans", () => {
    expect(normalizeLocale("zh-CN")).toBe("zh-Hans");
  });

  test("fallbacks to en when locale is unknown", () => {
    expect(normalizeLocale("fr")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
  });

  test("injects and replaces locale prefix in path", () => {
    expect(withLocale("/developers", "zh-Hans")).toBe("/zh-Hans/developers");
    expect(withLocale("/en/developers", "zh-Hant")).toBe("/zh-Hant/developers");
  });

  test("prefers cookie locale over accept-language", () => {
    const result = resolvePreferredLocale({
      cookieLocale: "zh-Hans",
      acceptLanguage: "en-US,en;q=0.8",
    });
    expect(result).toBe("zh-Hans");
  });
});
