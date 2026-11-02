import { IMAGE_SEQUENCE_EXPORT } from "@models/video/types";
import { AssetStatus } from "@schemas/asset";
import { Layer } from "@schemas/layer";
import { afterEach, describe, expect, it } from "vitest";

import {
  areFramesDownloadable,
  areVideoAndFramesDownloadable,
  isEXRDownloadable
} from "./utils";

const finishedRenderTrack = ({
  cloudMirrored,
  imageSequenceExport = IMAGE_SEQUENCE_EXPORT.PNG
}: {
  cloudMirrored?: boolean;
  imageSequenceExport?: string;
}): Layer =>
  ({
    id: "render-track",
    type: "RENDER",
    ...(cloudMirrored === undefined ? {} : { cloud_mirrored: cloudMirrored }),
    data: {},
    clips: [
      {
        asset: {
          data: {
            queue_status: AssetStatus.FINISHED,
            duration: 48,
            data: {
              render_settings: {
                magov2: { image_sequence_export: imageSequenceExport }
              }
            }
          }
        }
      }
    ]
  }) as unknown as Layer;

const setAccountMode = (mode: "cloud" | "offline") => {
  Object.defineProperty(window, "mago", {
    configurable: true,
    writable: true,
    value: { account: { mode } }
  });
};

afterEach(() => {
  Reflect.deleteProperty(window, "mago");
});

describe("frame and EXR downloads in Mago Studio", () => {
  it("offers frames and video+frames for a cloud-mirrored track when signed in", () => {
    setAccountMode("cloud");
    const track = finishedRenderTrack({ cloudMirrored: true });

    expect(areFramesDownloadable(track)).toBe(true);
    expect(areVideoAndFramesDownloadable(track)).toBe(true);
  });

  it("offers EXR for a cloud-mirrored EXR render when signed in", () => {
    setAccountMode("cloud");

    expect(
      isEXRDownloadable(
        finishedRenderTrack({
          cloudMirrored: true,
          imageSequenceExport: IMAGE_SEQUENCE_EXPORT.EXR_16BIT
        })
      )
    ).toBe(true);
  });

  it("hides them for a local-only track even when signed in", () => {
    setAccountMode("cloud");
    const track = finishedRenderTrack({ cloudMirrored: false });

    expect(areFramesDownloadable(track)).toBe(false);
    expect(areVideoAndFramesDownloadable(track)).toBe(false);
  });

  it("hides them for a cloud-mirrored track while working offline", () => {
    setAccountMode("offline");
    const track = finishedRenderTrack({ cloudMirrored: true });

    expect(areFramesDownloadable(track)).toBe(false);
    expect(areVideoAndFramesDownloadable(track)).toBe(false);
    expect(
      isEXRDownloadable(
        finishedRenderTrack({
          cloudMirrored: true,
          imageSequenceExport: IMAGE_SEQUENCE_EXPORT.EXR_16BIT
        })
      )
    ).toBe(false);
  });
});
