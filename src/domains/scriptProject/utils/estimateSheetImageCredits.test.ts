import { describe, expect, it } from "vitest";

import { buildOutputSize } from "./buildOutputSize";
import { estimateSheetImageCredits } from "./estimateSheetImageCredits";

const LARGEST_SCRIPT_PROJECT_SIZE = buildOutputSize("16:9", "1080p");
const SMALLEST_SCRIPT_PROJECT_SIZE = buildOutputSize("1:1", "768p");

describe("estimateSheetImageCredits", () => {
  it("prices every model, so switching the dropdown never blanks the estimate", () => {
    for (const renderModel of [
      "seedream_5_pro_t2i",
      "gpt_image_2_t2i",
      "nanobanana_2_t2i"
    ] as const) {
      expect(
        estimateSheetImageCredits(renderModel, LARGEST_SCRIPT_PROJECT_SIZE)
      ).toBeGreaterThan(0);
    }
  });

  describe("seedream_5_pro_t2i", () => {
    it("bills the low tier at or below a 1536x1536 area", () => {
      expect(
        estimateSheetImageCredits("seedream_5_pro_t2i", [1536, 1536])
      ).toBe(60);
    });

    it("bills the high tier above it", () => {
      expect(
        estimateSheetImageCredits("seedream_5_pro_t2i", [1544, 1536])
      ).toBe(120);
    });

    it("stays on the low tier for every size a script project can produce", () => {
      expect(
        estimateSheetImageCredits(
          "seedream_5_pro_t2i",
          LARGEST_SCRIPT_PROJECT_SIZE
        )
      ).toBe(60);
    });
  });

  describe("gpt_image_2_t2i", () => {
    it("quotes the high-quality standard tier, which is what an absent quality bills", () => {
      expect(estimateSheetImageCredits("gpt_image_2_t2i", [2560, 1440])).toBe(
        190
      );
    });

    it("quotes the larger tier above a 2560x1440 area", () => {
      expect(estimateSheetImageCredits("gpt_image_2_t2i", [3840, 2160])).toBe(
        344
      );
    });

    it("stays on the standard tier for every size a script project can produce", () => {
      expect(
        estimateSheetImageCredits(
          "gpt_image_2_t2i",
          LARGEST_SCRIPT_PROJECT_SIZE
        )
      ).toBe(190);
    });
  });

  describe("nanobanana_2_t2i", () => {
    it("snaps the long edge to the closest size class, not the enclosing one", () => {
      expect(estimateSheetImageCredits("nanobanana_2_t2i", [1080, 1920])).toBe(
        183
      );
      expect(estimateSheetImageCredits("nanobanana_2_t2i", [1440, 1080])).toBe(
        122
      );
    });

    it("prices a small square at the half-K class", () => {
      expect(
        estimateSheetImageCredits(
          "nanobanana_2_t2i",
          SMALLEST_SCRIPT_PROJECT_SIZE
        )
      ).toBe(92);
    });

    it("tops out at the 4K class", () => {
      expect(estimateSheetImageCredits("nanobanana_2_t2i", [8000, 4500])).toBe(
        243
      );
    });
  });
});
