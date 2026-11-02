import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { BulkRendersRunDraftMasterSettings } from "@store/atoms";
import { describe, expect, it } from "vitest";

import { buildBulkRenderingDraftShotVideoSettings } from "./buildBulkRenderingDraftShotVideoSettings";

const masterVideoModel = {
  name: VideoEngine.V3_4_0
} as VideoModelDefinition;

const masterSettings: BulkRendersRunDraftMasterSettings = {
  imageSettings: {} as Img2ImgType,
  videoSettings: { prompt: "master prompt", steps: 30 },
  videoModel: masterVideoModel,
  frameRange: [0, 48],
  isFullFrameRangePresetSelected: false
};

describe("buildBulkRenderingDraftShotVideoSettings", () => {
  it("merges the Shot's patch over the master settings", () => {
    const result = buildBulkRenderingDraftShotVideoSettings({
      masterSettings,
      shotVideoSettingsPatch: { steps: 45 }
    });

    expect(result).toEqual({ prompt: "master prompt", steps: 45 });
  });

  it("returns the master settings untouched when the Shot has no patch", () => {
    const result = buildBulkRenderingDraftShotVideoSettings({
      masterSettings,
      shotVideoSettingsPatch: {}
    });

    expect(result).toEqual({ prompt: "master prompt", steps: 30 });
  });
});
