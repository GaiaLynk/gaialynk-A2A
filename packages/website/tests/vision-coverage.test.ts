import { describe, expect, test } from "vitest";
import { CAPABILITY_STATUSES, VISION_TRACKS_BY_LOCALE } from "../src/content/vision-coverage";

describe("vision coverage status system", () => {
  test("supports four statuses and localized tracks include In Progress", () => {
    expect(new Set(CAPABILITY_STATUSES)).toEqual(new Set(["Now", "In Progress", "Coming Soon", "Research"]));
    const locales = Object.keys(VISION_TRACKS_BY_LOCALE) as Array<keyof typeof VISION_TRACKS_BY_LOCALE>;
    for (const locale of locales) {
      const statuses = new Set(VISION_TRACKS_BY_LOCALE[locale].map((item) => item.status));
      expect(statuses.has("Now")).toBe(true);
      expect(statuses.has("In Progress")).toBe(true);
      expect(statuses.has("Coming Soon")).toBe(true);
      expect(statuses.has("Research")).toBe(true);
    }
  });
});
