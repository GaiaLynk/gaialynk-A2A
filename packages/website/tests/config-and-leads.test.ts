import { describe, expect, test } from "vitest";
import { buildDocsUrl } from "../src/lib/config/public";
import { parseLeadInput } from "../src/lib/leads/parse";

describe("docs url builder", () => {
  test("appends UTM params for docs route", () => {
    const url = buildDocsUrl("en");
    expect(url).toContain("utm_source=website");
    expect(url).toContain("utm_medium=entry");
    expect(url).toContain("utm_campaign=phase1");
    expect(url).toContain("utm_content=en_docs_entry");
  });
});

describe("lead input parser", () => {
  test("accepts valid waitlist payload", () => {
    const result = parseLeadInput({
      type: "waitlist",
      locale: "en",
      name: "Alex",
      email: "alex@example.com",
      company: "Gaia",
      useCase: "Developer onboarding",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.type).toBe("waitlist");
    }
  });

  test("rejects missing email", () => {
    const result = parseLeadInput({
      type: "demo",
      locale: "en",
      name: "Alex",
      email: "",
      company: "Gaia",
      useCase: "Risk workflow",
    });

    expect(result.ok).toBe(false);
  });
});
