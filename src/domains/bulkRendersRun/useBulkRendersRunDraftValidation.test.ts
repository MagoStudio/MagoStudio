import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { seedance2Model } from "@models/video/seedance2Model";
import { VideoSettings } from "@models/video/types";
import { BulkRendersRunDraftMasterSettings } from "@store/atoms";
import { describe, expect, it } from "vitest";

import { BulkRenderingDraftShotVideoSettingsState } from "./useBulkRenderingDraftShotVideoSettings";
import { useBulkRendersRunDraftValidation } from "./useBulkRendersRunDraftValidation";

const masterSettings: BulkRendersRunDraftMasterSettings = {
  imageSettings: {} as Img2ImgType,
  videoSettings: {
    mago_engine: seedance2Model.name,
    prompt: "a valid master prompt"
  },
  videoModel: seedance2Model,
  frameRange: [0, 48],
  isFullFrameRangePresetSelected: false
};

const buildDraftShotVideoSettings = (
  shotVideoSettingsOverrideById: Record<string, Partial<VideoSettings>>
): BulkRenderingDraftShotVideoSettingsState => ({
  getVideoSetting: (_shotId, key) => masterSettings.videoSettings[key],
  setVideoSetting: () => {},
  hasAnyShotVideoSettingsOverride:
    Object.keys(shotVideoSettingsOverrideById).length > 0,
  shotVideoSettingsOverrideById
});

describe("useBulkRendersRunDraftValidation", () => {
  it("reports no error for a Shot that follows a valid master", () => {
    const errorsByShotId = useBulkRendersRunDraftValidation({
      shotIds: ["shot-1", "shot-2"],
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings({}),
      firstFrameSource: "generated",
      uploadedFirstFrameAssetIdByShotId: {}
    });

    expect(errorsByShotId).toEqual({ "shot-1": [], "shot-2": [] });
  });

  it("reports an invalid override against the master video model, for the offending Shot only", () => {
    const errorsByShotId = useBulkRendersRunDraftValidation({
      shotIds: ["shot-1", "shot-2"],
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings({
        "shot-1": { prompt: "" }
      }),
      firstFrameSource: "generated",
      uploadedFirstFrameAssetIdByShotId: {}
    });

    expect(errorsByShotId["shot-1"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "prompt" })])
    );
    expect(errorsByShotId["shot-2"]).toEqual([]);
  });

  it("carries an invalid master through to every Shot, because each resolves against it", () => {
    const errorsByShotId = useBulkRendersRunDraftValidation({
      shotIds: ["shot-1", "shot-2"],
      masterSettings: {
        ...masterSettings,
        videoSettings: { mago_engine: seedance2Model.name, prompt: "" }
      },
      draftShotVideoSettings: buildDraftShotVideoSettings({}),
      firstFrameSource: "generated",
      uploadedFirstFrameAssetIdByShotId: {}
    });

    expect(errorsByShotId["shot-1"].length).toBeGreaterThan(0);
    expect(errorsByShotId["shot-2"].length).toBeGreaterThan(0);
  });

  it("lets a Shot's own override rescue it from an invalid master", () => {
    const errorsByShotId = useBulkRendersRunDraftValidation({
      shotIds: ["shot-1", "shot-2"],
      masterSettings: {
        ...masterSettings,
        videoSettings: { mago_engine: seedance2Model.name, prompt: "" }
      },
      draftShotVideoSettings: buildDraftShotVideoSettings({
        "shot-1": { prompt: "a valid per-Shot prompt" }
      }),
      firstFrameSource: "generated",
      uploadedFirstFrameAssetIdByShotId: {}
    });

    expect(errorsByShotId["shot-1"]).toEqual([]);
    expect(errorsByShotId["shot-2"].length).toBeGreaterThan(0);
  });

  it("blocks a supplied-frames Shot with no uploaded image, naming that Shot", () => {
    const errorsByShotId = useBulkRendersRunDraftValidation({
      shotIds: ["shot-1", "shot-2", "shot-3"],
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings({}),
      firstFrameSource: "uploaded",
      uploadedFirstFrameAssetIdByShotId: {
        "shot-1": "asset-1",
        "shot-3": "asset-3"
      }
    });

    expect(errorsByShotId["shot-1"]).toEqual([]);
    expect(errorsByShotId["shot-2"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "firstFrame" })])
    );
    expect(errorsByShotId["shot-3"]).toEqual([]);
  });

  it("never blocks on a missing first frame for a generated-frames draft", () => {
    const errorsByShotId = useBulkRendersRunDraftValidation({
      shotIds: ["shot-1"],
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings({}),
      firstFrameSource: "generated",
      uploadedFirstFrameAssetIdByShotId: {}
    });

    expect(errorsByShotId["shot-1"]).toEqual([]);
  });

  it("combines a video-settings error and a missing-first-frame error for the same Shot", () => {
    const errorsByShotId = useBulkRendersRunDraftValidation({
      shotIds: ["shot-1"],
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings({
        "shot-1": { prompt: "" }
      }),
      firstFrameSource: "uploaded",
      uploadedFirstFrameAssetIdByShotId: {}
    });

    expect(errorsByShotId["shot-1"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "prompt" }),
        expect.objectContaining({ key: "firstFrame" })
      ])
    );
    expect(errorsByShotId["shot-1"].length).toBe(2);
  });
});
