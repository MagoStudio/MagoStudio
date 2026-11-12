import {
  SheetGroup,
  SheetGroupSchema,
  ShotState
} from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { resolveShotReferenceImageSizes } from "./resolveShotReferenceImageSizes";

const OUTPUT_SIZE: [number, number] = [1368, 768];

const shotWithReferences = (references: ShotState["references"]): ShotState =>
  ({ references }) as unknown as ShotState;

const sheetGroupWithImages = (
  images: { asset_id: string; render_spec?: Record<string, unknown> }[]
): SheetGroup => ({ images }) as unknown as SheetGroup;

describe("resolveShotReferenceImageSizes", () => {
  it("returns nothing for a Shot with no references and no continuation", () => {
    expect(
      resolveShotReferenceImageSizes({
        shot: shotWithReferences({}),
        sheetGroups: [],
        outputSize: OUTPUT_SIZE,
        isContinuationSent: false
      })
    ).toEqual([]);
  });

  it("reads each tagged reference's size from its sheet image, across categories", () => {
    expect(
      resolveShotReferenceImageSizes({
        shot: shotWithReferences({
          characters: [
            { token: "@a", asset_id: "a1" },
            { token: "@b", asset_id: "a2" }
          ],
          environments: [{ token: "@c", asset_id: "a3" }]
        }),
        sheetGroups: [
          sheetGroupWithImages([
            { asset_id: "a1", render_spec: { output_size: [1024, 1024] } },
            { asset_id: "a3", render_spec: { output_size: [1920, 1080] } }
          ])
        ],
        outputSize: OUTPUT_SIZE,
        isContinuationSent: false
      })
    ).toEqual([[1024, 1024], null, [1920, 1080]]);
  });

  it("adds the continuation frame at the project's output size", () => {
    expect(
      resolveShotReferenceImageSizes({
        shot: shotWithReferences({}),
        sheetGroups: [],
        outputSize: OUTPUT_SIZE,
        isContinuationSent: true
      })
    ).toEqual([OUTPUT_SIZE]);
  });

  it("preserves and prefers actual asset dimensions, including uploaded images", () => {
    const group = SheetGroupSchema.parse({
      token: "a",
      name: "A",
      layer_id: "layer-a",
      images: [
        {
          asset_id: "upload",
          clip_id: "clip-upload",
          status: "success",
          source: "upload",
          size: [1920, 1080],
          render_spec: null
        },
        {
          asset_id: "render",
          clip_id: "clip-render",
          status: "success",
          size: [1024, 768],
          render_spec: { output_size: [1024, 1024] }
        }
      ]
    });

    expect(
      resolveShotReferenceImageSizes({
        shot: shotWithReferences({
          characters: [
            { token: "@a", asset_id: "upload" },
            { token: "@b", asset_id: "render" }
          ]
        }),
        sheetGroups: [group],
        outputSize: OUTPUT_SIZE,
        isContinuationSent: false
      })
    ).toEqual([
      [1920, 1080],
      [1024, 768]
    ]);
  });
});
