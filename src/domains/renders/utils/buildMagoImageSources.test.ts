import { SourceImage, SourceImageType } from "@domains/renders/types";
import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { buildMagoImageSources } from "./buildMagoImageSources";

describe("buildMagoImageSources", () => {
  const keyFrame: SourceImage = {
    asset_id: "a",
    type: "key_frame",
    index: 3
  };

  describe("reference-only engines (v4.0.0, v4.1.0, v5.0.0)", () => {
    it.each([VideoEngine.V4_0_0, VideoEngine.V4_1_0, VideoEngine.V5_0_0])(
      "maps the single style image to a lone reference_frame for %s",
      (engine) => {
        expect(buildMagoImageSources(engine, [keyFrame])).toEqual([
          { asset_id: "a", type: "reference_frame" }
        ]);
      }
    );

    it("derives reference_frame from an already-reference_frame source", () => {
      expect(
        buildMagoImageSources(VideoEngine.V4_0_0, [
          { asset_id: "a", type: "reference_frame" }
        ])
      ).toEqual([{ asset_id: "a", type: "reference_frame" }]);
    });

    it("returns no entries when there is no image", () => {
      expect(buildMagoImageSources(VideoEngine.V5_0_0, [])).toEqual([]);
    });
  });

  describe("reference-and-key-frame engine (v3.4.0)", () => {
    it.each([VideoEngine.V3_4_0])(
      "emits the same image as both reference_frame and key_frame for %s",
      (engine) => {
        expect(buildMagoImageSources(engine, [keyFrame])).toEqual([
          { asset_id: "a", type: "reference_frame" },
          { asset_id: "a", type: "key_frame", index: 3 }
        ]);
      }
    );

    it("defaults the key_frame index to 0 when the source has none", () => {
      expect(
        buildMagoImageSources(VideoEngine.V3_4_0, [
          { asset_id: "a", type: "key_frame" }
        ])
      ).toEqual([
        { asset_id: "a", type: "reference_frame" },
        { asset_id: "a", type: "key_frame", index: 0 }
      ]);
    });

    it("returns no entries when there is no image", () => {
      expect(buildMagoImageSources(VideoEngine.V3_4_0, [])).toEqual([]);
    });
  });

  describe("engines outside the mapping", () => {
    it.each([VideoEngine.V3_3_0_CNETS, VideoEngine.V2_5_0])(
      "returns the sources untouched for team-only legacy engine %s",
      (engine) => {
        const sources: SourceImage[] = [keyFrame];
        expect(buildMagoImageSources(engine, sources)).toEqual(sources);
      }
    );

    it("returns the sources untouched for v5.1.0 inpainting", () => {
      const sources: SourceImage[] = [
        { asset_id: "a", type: "reference_frame" }
      ];
      expect(buildMagoImageSources(VideoEngine.V5_1_0, sources)).toEqual(
        sources
      );
    });

    it("returns the sources untouched for an undefined engine", () => {
      const sources: SourceImage[] = [keyFrame];
      expect(buildMagoImageSources(undefined, sources)).toEqual(sources);
    });
  });

  describe("literal role expectations are the source of truth, not the declaration", () => {
    const enginesWithExpectedWireSourceRoles: Array<{
      engine: VideoEngine;
      expectedRoles: SourceImageType[];
    }> = [
      {
        engine: VideoEngine.V3_4_0,
        expectedRoles: ["reference_frame", "key_frame"]
      },
      { engine: VideoEngine.V4_0_0, expectedRoles: ["reference_frame"] },
      { engine: VideoEngine.V4_1_0, expectedRoles: ["reference_frame"] },
      { engine: VideoEngine.V5_0_0, expectedRoles: ["reference_frame"] }
    ];

    it.each(enginesWithExpectedWireSourceRoles)(
      "emits exactly the literal roles declared for $engine, in declaration order",
      ({ engine, expectedRoles }) => {
        expect(
          buildMagoImageSources(engine, [keyFrame]).map((entry) => entry.type)
        ).toEqual(expectedRoles);
      }
    );

    const modelsDeclaringNoWireSourceRoles = RENDER_MODELS.filter(
      (model) => (model.capabilities.wireSourceRoles ?? []).length === 0
    );

    it("covers at least one non-declaring model, so the pass-through suite below cannot silently register zero tests", () => {
      expect(modelsDeclaringNoWireSourceRoles.length).toBeGreaterThan(0);
    });

    it.each(modelsDeclaringNoWireSourceRoles)(
      "passes sources through for $name, which declares none",
      (model) => {
        const sources: SourceImage[] = [keyFrame];
        expect(buildMagoImageSources(model.name, sources)).toEqual(sources);
      }
    );
  });
});
