import { VideoEngine } from "@models/video/types";
import { describe, it, expect } from "vitest";

import { computeTrackName } from "./computeTrackName";

const DEFAULT_NAME = "Shot One";

describe("computeTrackName", () => {
  describe("mask engine", () => {
    it("returns (1) when no existing mask track matches the source", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.v1_0_0_mask,
          existingTrackNames: ["Clip A", "Clip B"],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_Mask (1)");
    });

    it("returns (2) when one matching mask track exists", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.v1_0_0_mask,
          existingTrackNames: ["Clip A", "Clip A_Mask (1)"],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_Mask (2)");
    });

    it("uses max+1 and does not fill gaps", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.v1_0_0_mask,
          existingTrackNames: ["Clip A_Mask (1)", "Clip A_Mask (3)"],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_Mask (4)");
    });

    it("supports chaining (mask of a mask)", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A_Mask (1)",
          modelEngine: VideoEngine.v1_0_0_mask,
          existingTrackNames: ["Clip A", "Clip A_Mask (1)"],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_Mask (1)_Mask (1)");
    });

    it("resets to (1) when all matching tracks were renamed or deleted", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.v1_0_0_mask,
          existingTrackNames: ["Clip A", "My Renamed Mask"],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_Mask (1)");
    });

    it("escapes regex special characters in the source name", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip (A) [v1].mov",
          modelEngine: VideoEngine.v1_0_0_mask,
          existingTrackNames: ["Clip (A) [v1].mov_Mask (1)"],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip (A) [v1].mov_Mask (2)");
    });

    it("does not match partial or misformatted names", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.v1_0_0_mask,
          existingTrackNames: [
            "Clip A_Mask",
            "Clip A_Mask ()",
            "Clip A_Mask (abc)",
            "Clip A_Mask (1) extra",
            "prefix Clip A_Mask (5)"
          ],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_Mask (1)");
    });

    it("ignores tracks targeting a different source", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.v1_0_0_mask,
          existingTrackNames: ["Clip B_Mask (3)", "Clip B_Mask (7)"],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_Mask (1)");
    });
  });

  describe("upscale engine", () => {
    it("returns (1) for the first upscale track", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.v2_0_0_esrgan_upscaler,
          existingTrackNames: ["Clip A"],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_Upscale (1)");
    });

    it("counts independently from mask tracks", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.v2_0_0_esrgan_upscaler,
          existingTrackNames: ["Clip A", "Clip A_Mask (1)", "Clip A_Mask (2)"],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_Upscale (1)");
    });
  });

  describe("creative upscale engine", () => {
    it("returns (1) for the first creative-upscale track", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.v1_0_0_upscaler,
          existingTrackNames: [],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_CreativeUpscale (1)");
    });

    it("increments with max+1", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.v1_0_0_upscaler,
          existingTrackNames: [
            "Clip A_CreativeUpscale (1)",
            "Clip A_CreativeUpscale (2)"
          ],
          defaultName: DEFAULT_NAME
        })
      ).toBe("Clip A_CreativeUpscale (3)");
    });
  });

  describe("non-matching engines", () => {
    it("returns the default name for a standard render engine", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: VideoEngine.V3_4_0,
          existingTrackNames: ["Clip A"],
          defaultName: DEFAULT_NAME
        })
      ).toBe(DEFAULT_NAME);
    });

    it("returns the default name when modelEngine is undefined", () => {
      expect(
        computeTrackName({
          sourceTrackName: "Clip A",
          modelEngine: undefined,
          existingTrackNames: [],
          defaultName: DEFAULT_NAME
        })
      ).toBe(DEFAULT_NAME);
    });
  });

  it("handles an empty existingTrackNames list", () => {
    expect(
      computeTrackName({
        sourceTrackName: "Clip A",
        modelEngine: VideoEngine.v1_0_0_mask,
        existingTrackNames: [],
        defaultName: DEFAULT_NAME
      })
    ).toBe("Clip A_Mask (1)");
  });
});
