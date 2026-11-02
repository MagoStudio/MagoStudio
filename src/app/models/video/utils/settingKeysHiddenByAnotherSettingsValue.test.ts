import { describe, expect, it } from "vitest";

import { magoV3_4_0RenderModel } from "../magoV3_4_0VideoModel";
import { minimaxReferenceVideoModel } from "../minimaxReferenceVideoModel";
import { VideoEngine, VideoSettings } from "../types";

import { settingKeysHiddenByAnotherSettingsValue } from "./settingKeysHiddenByAnotherSettingsValue";

describe("settingKeysHiddenByAnotherSettingsValue", () => {
  it("hides use_video_audio once the user turns the video reference off", () => {
    const hidden = settingKeysHiddenByAnotherSettingsValue(
      minimaxReferenceVideoModel,
      {
        mago_engine: VideoEngine.minimax_reference,
        use_video_reference: false
      }
    );

    expect(hidden).toContain("use_video_audio");
  });

  it("keeps use_video_audio while the video reference is on", () => {
    const hidden = settingKeysHiddenByAnotherSettingsValue(
      minimaxReferenceVideoModel,
      {
        mago_engine: VideoEngine.minimax_reference,
        use_video_reference: true
      }
    );

    expect(hidden).not.toContain("use_video_audio");
  });

  it("leaves a permanently hidden setting alone, since the user never made it disappear", () => {
    const hidden = settingKeysHiddenByAnotherSettingsValue(
      magoV3_4_0RenderModel,
      { mago_engine: VideoEngine.V3_4_0 } as VideoSettings
    );

    expect(hidden).not.toContain("negative_prompt");
  });

  it("hides nothing for a model whose settings carry only their own defaults", () => {
    expect(
      settingKeysHiddenByAnotherSettingsValue(minimaxReferenceVideoModel, {
        mago_engine: VideoEngine.minimax_reference
      })
    ).toEqual([]);
  });
});
