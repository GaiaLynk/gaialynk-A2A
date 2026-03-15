import { describe, expect, test } from "vitest";
import { PRODUCT_API_CAPABILITIES, VISION_TRACKS_BY_LOCALE } from "../src/content/vision-coverage";

describe("website promise consistency gate", () => {
  test("Now tracks always map to real product path and Now API capabilities", () => {
    const locales = Object.keys(VISION_TRACKS_BY_LOCALE) as Array<keyof typeof VISION_TRACKS_BY_LOCALE>;
    for (const locale of locales) {
      const tracks = VISION_TRACKS_BY_LOCALE[locale];
      const nowTracks = tracks.filter((item) => item.status === "Now");
      expect(nowTracks.length).toBeGreaterThan(0);
      for (const track of nowTracks) {
        expect(track.productPath.trim().startsWith("/")).toBe(true);
        expect(track.requiredApiCapabilities.length).toBeGreaterThan(0);
        for (const capabilityKey of track.requiredApiCapabilities) {
          const capability = PRODUCT_API_CAPABILITIES[capabilityKey];
          expect(capability, `${locale}:${track.track}:${capabilityKey}`).toBeTruthy();
          expect(capability?.status).toBe("Now");
          expect(capability?.endpoint.startsWith("/api/v1/")).toBe(true);
        }
      }
    }
  });
});
