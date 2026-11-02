import { IMAGE_SEQUENCE_EXPORT } from "@models/video/types";
import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { isEXRRender } from "./utils";

const layerWithImageSequenceExport = (value: string | undefined): Layer =>
  ({
    clips: [
      {
        asset: {
          data: {
            data: {
              render_settings: {
                magov2: { image_sequence_export: value }
              }
            }
          }
        }
      }
    ]
  }) as unknown as Layer;

describe("isEXRRender", () => {
  it("returns true when image_sequence_export is EXR 16-bit", () => {
    expect(
      isEXRRender(layerWithImageSequenceExport(IMAGE_SEQUENCE_EXPORT.EXR_16BIT))
    ).toBe(true);
  });

  it("returns false when image_sequence_export is PNG", () => {
    expect(
      isEXRRender(layerWithImageSequenceExport(IMAGE_SEQUENCE_EXPORT.PNG))
    ).toBe(false);
  });

  it("returns false when image_sequence_export is missing", () => {
    expect(isEXRRender(layerWithImageSequenceExport(undefined))).toBe(false);
  });

  it("returns false for the deprecated exr_32bit value", () => {
    expect(isEXRRender(layerWithImageSequenceExport("exr_32bit"))).toBe(false);
  });

  it("returns true when convert_exrs_to_pngs is false (raw BE field)", () => {
    const layer = {
      clips: [
        {
          asset: {
            data: {
              data: {
                render_settings: {
                  magov2: { convert_exrs_to_pngs: false }
                }
              }
            }
          }
        }
      ]
    } as unknown as Layer;
    expect(isEXRRender(layer)).toBe(true);
  });

  it("returns false when convert_exrs_to_pngs is true (raw BE field)", () => {
    const layer = {
      clips: [
        {
          asset: {
            data: {
              data: {
                render_settings: {
                  magov2: { convert_exrs_to_pngs: true }
                }
              }
            }
          }
        }
      ]
    } as unknown as Layer;
    expect(isEXRRender(layer)).toBe(false);
  });
});
