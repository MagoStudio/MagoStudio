import { describe, expect, it } from "vitest";

import { mergeBulkRenderingDraftShotOverrides } from "./mergeBulkRenderingDraftShotOverrides";

describe("mergeBulkRenderingDraftShotOverrides", () => {
  it("returns an empty map when no source has an override", () => {
    expect(
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: {},
        imageReferenceAssetIdsOverrideByShotId: {},
        imageSettingsOverrideByShotId: {},
        imageSourceFrameOverrideByShotId: {},
        shotVideoSettingsOverrideById: {},
        uploadedFirstFrameAssetIdByShotId: {}
      })
    ).toEqual({});
  });

  it("carries a prompt-only override through untouched", () => {
    expect(
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: { "shot-1": { imagePrompt: "a castle" } },
        imageReferenceAssetIdsOverrideByShotId: {},
        imageSettingsOverrideByShotId: {},
        imageSourceFrameOverrideByShotId: {},
        shotVideoSettingsOverrideById: {},
        uploadedFirstFrameAssetIdByShotId: {}
      })
    ).toEqual({ "shot-1": { imagePrompt: "a castle" } });
  });

  it("carries a reference-only override through untouched", () => {
    expect(
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: {},
        imageReferenceAssetIdsOverrideByShotId: { "shot-1": ["asset-1"] },
        imageSettingsOverrideByShotId: {},
        imageSourceFrameOverrideByShotId: {},
        shotVideoSettingsOverrideById: {},
        uploadedFirstFrameAssetIdByShotId: {}
      })
    ).toEqual({ "shot-1": { imageReferenceAssetIds: ["asset-1"] } });
  });

  it("combines both overrides on one Shot", () => {
    expect(
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: {
          "shot-1": { imagePrompt: "a castle", videoPrompt: "slow pan" }
        },
        imageReferenceAssetIdsOverrideByShotId: { "shot-1": ["asset-1"] },
        imageSettingsOverrideByShotId: {},
        imageSourceFrameOverrideByShotId: {},
        shotVideoSettingsOverrideById: {},
        uploadedFirstFrameAssetIdByShotId: {}
      })
    ).toEqual({
      "shot-1": {
        imagePrompt: "a castle",
        videoPrompt: "slow pan",
        imageReferenceAssetIds: ["asset-1"]
      }
    });
  });

  it("keeps an emptied reference list as an override", () => {
    expect(
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: {},
        imageReferenceAssetIdsOverrideByShotId: { "shot-1": [] },
        imageSettingsOverrideByShotId: {},
        imageSourceFrameOverrideByShotId: {},
        shotVideoSettingsOverrideById: {},
        uploadedFirstFrameAssetIdByShotId: {}
      })
    ).toEqual({ "shot-1": { imageReferenceAssetIds: [] } });
  });

  it("merges overrides that land on different Shots", () => {
    expect(
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: { "shot-1": { imagePrompt: "a castle" } },
        imageReferenceAssetIdsOverrideByShotId: { "shot-2": ["asset-1"] },
        imageSettingsOverrideByShotId: {},
        imageSourceFrameOverrideByShotId: {},
        shotVideoSettingsOverrideById: {},
        uploadedFirstFrameAssetIdByShotId: {}
      })
    ).toEqual({
      "shot-1": { imagePrompt: "a castle" },
      "shot-2": { imageReferenceAssetIds: ["asset-1"] }
    });
  });

  it("carries a video settings patch-only override through untouched", () => {
    expect(
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: {},
        imageReferenceAssetIdsOverrideByShotId: {},
        imageSettingsOverrideByShotId: {},
        imageSourceFrameOverrideByShotId: {},
        shotVideoSettingsOverrideById: { "shot-1": { steps: 30 } },
        uploadedFirstFrameAssetIdByShotId: {}
      })
    ).toEqual({ "shot-1": { videoSettingsPatch: { steps: 30 } } });
  });

  it("carries an image source frame-only override through untouched", () => {
    expect(
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: {},
        imageReferenceAssetIdsOverrideByShotId: {},
        imageSettingsOverrideByShotId: {},
        imageSourceFrameOverrideByShotId: { "shot-1": 120 },
        shotVideoSettingsOverrideById: {},
        uploadedFirstFrameAssetIdByShotId: {}
      })
    ).toEqual({ "shot-1": { imageSourceFrame: 120 } });
  });

  it("carries an uploaded-first-frame-only Shot through, with no other override", () => {
    expect(
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: {},
        imageReferenceAssetIdsOverrideByShotId: {},
        imageSettingsOverrideByShotId: {},
        imageSourceFrameOverrideByShotId: {},
        shotVideoSettingsOverrideById: {},
        uploadedFirstFrameAssetIdByShotId: { "shot-1": "asset-1" }
      })
    ).toEqual({ "shot-1": { uploadedFirstFrameAssetId: "asset-1" } });
  });

  it("combines an uploaded first frame with a video settings patch on the same Shot", () => {
    expect(
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: {},
        imageReferenceAssetIdsOverrideByShotId: {},
        imageSettingsOverrideByShotId: {},
        imageSourceFrameOverrideByShotId: {},
        shotVideoSettingsOverrideById: { "shot-1": { steps: 30 } },
        uploadedFirstFrameAssetIdByShotId: { "shot-1": "asset-1" }
      })
    ).toEqual({
      "shot-1": {
        uploadedFirstFrameAssetId: "asset-1",
        videoSettingsPatch: { steps: 30 }
      }
    });
  });
});
