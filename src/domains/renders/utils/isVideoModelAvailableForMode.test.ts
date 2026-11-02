import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { isVideoModelAvailableForMode } from "./isVideoModelAvailableForMode";

const buildModel = (
  overrides: Partial<VideoModelDefinition> = {}
): VideoModelDefinition =>
  ({
    name: VideoEngine.V3_4_0,
    status: "active",
    ...overrides
  }) as VideoModelDefinition;

const generalPublic = { isTeamMember: false };
const teamMember = { isTeamMember: true };

describe("isVideoModelAvailableForMode", () => {
  describe("normal mode", () => {
    it("includes an active, non-upscale model", () => {
      expect(
        isVideoModelAvailableForMode(buildModel(), "normal", generalPublic)
      ).toBe(true);
    });

    it("excludes an upscale model", () => {
      const model = buildModel({ name: VideoEngine.v1_0_0_upscaler });

      expect(isVideoModelAvailableForMode(model, "normal", generalPublic)).toBe(
        false
      );
    });

    it("excludes a mask model", () => {
      const model = buildModel({
        name: VideoEngine.v1_0_0_mask,
        status: "hidden"
      });

      expect(isVideoModelAvailableForMode(model, "normal", generalPublic)).toBe(
        false
      );
    });

    it("excludes deprecated and hidden models", () => {
      expect(
        isVideoModelAvailableForMode(
          buildModel({ status: "deprecated" }),
          "normal",
          generalPublic
        )
      ).toBe(false);
      expect(
        isVideoModelAvailableForMode(
          buildModel({ status: "hidden" }),
          "normal",
          generalPublic
        )
      ).toBe(false);
    });

    it("reveals a team-only model to team members only", () => {
      const model = buildModel({ status: "team_only" });

      expect(isVideoModelAvailableForMode(model, "normal", generalPublic)).toBe(
        false
      );
      expect(isVideoModelAvailableForMode(model, "normal", teamMember)).toBe(
        true
      );
    });
  });

  describe("upscale mode", () => {
    it("includes an active upscale model", () => {
      const model = buildModel({ name: VideoEngine.v1_0_0_upscaler });

      expect(
        isVideoModelAvailableForMode(model, "upscale", generalPublic)
      ).toBe(true);
    });

    it("excludes a non-upscale model", () => {
      expect(
        isVideoModelAvailableForMode(buildModel(), "upscale", generalPublic)
      ).toBe(false);
    });

    it("still applies the deprecated/hidden/team gates to upscale models", () => {
      const hiddenUpscaler = buildModel({
        name: VideoEngine.v1_0_0_upscaler,
        status: "hidden"
      });

      expect(
        isVideoModelAvailableForMode(hiddenUpscaler, "upscale", generalPublic)
      ).toBe(false);
    });
  });

  describe("mask mode", () => {
    it("includes the mask model regardless of status", () => {
      const model = buildModel({
        name: VideoEngine.v1_0_0_mask,
        status: "hidden"
      });

      expect(isVideoModelAvailableForMode(model, "mask", generalPublic)).toBe(
        true
      );
    });

    it("excludes every non-mask model, even an otherwise-available one", () => {
      expect(
        isVideoModelAvailableForMode(buildModel(), "mask", teamMember)
      ).toBe(false);
    });
  });
});
