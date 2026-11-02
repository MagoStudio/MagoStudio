import { BulkRenderingDraftShotVideoSettingsState } from "@domains/bulkRendersRun/useBulkRenderingDraftShotVideoSettings";
import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine } from "@models/video/types";
import { BulkRendersRunDraftMasterSettings } from "@store/atoms";
import { describe, expect, it } from "vitest";

import { computeBulkRendersRunShotVideoCredits } from "./computeBulkRendersRunShotVideoCredits";
import { estimateBulkRendersRunCredits } from "./estimateBulkRendersRunCredits";

const masterVideoModel = RENDER_MODELS.find(
  (model) => model.name === VideoEngine.V4_0_0
)!;

const masterSettings: BulkRendersRunDraftMasterSettings = {
  imageSettings: {} as Img2ImgType,
  videoSettings: { max_size: 1024, steps: 30 },
  videoModel: masterVideoModel,
  frameRange: [0, 48],
  isFullFrameRangePresetSelected: false
};

const buildDraftShotVideoSettings =
  (): BulkRenderingDraftShotVideoSettingsState => ({
    getVideoSetting: (_shotId, key) => masterSettings.videoSettings[key],
    setVideoSetting: () => {},
    hasAnyShotVideoSettingsOverride: false,
    shotVideoSettingsOverrideById: {}
  });

describe("computeBulkRendersRunShotVideoCredits", () => {
  it("prices a Shot from that Shot's own frame length, not a shared run-level length", () => {
    const shotMaxFramesById = new Map([
      ["shot-short", 24],
      ["shot-long", 240]
    ]);
    const shotFpsById = new Map<string, number>();

    const shortShotCredits = computeBulkRendersRunShotVideoCredits({
      shotId: "shot-short",
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings(),
      shotMaxFramesById,
      shotFpsById
    }).credits;
    const longShotCredits = computeBulkRendersRunShotVideoCredits({
      shotId: "shot-long",
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings(),
      shotMaxFramesById,
      shotFpsById
    }).credits;

    expect(shortShotCredits).not.toBe(longShotCredits);
    expect(longShotCredits).toBeGreaterThan(shortShotCredits);
  });

  it("sums each Shot's own frame-length-priced cost rather than a multiple of one Shot's cost", () => {
    const shotMaxFramesById = new Map([
      ["shot-short", 24],
      ["shot-long", 240]
    ]);
    const shotFpsById = new Map<string, number>();

    const shortShotCredits = computeBulkRendersRunShotVideoCredits({
      shotId: "shot-short",
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings(),
      shotMaxFramesById,
      shotFpsById
    }).credits;
    const longShotCredits = computeBulkRendersRunShotVideoCredits({
      shotId: "shot-long",
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings(),
      shotMaxFramesById,
      shotFpsById
    }).credits;

    const totalRunCredits = estimateBulkRendersRunCredits({
      imageCreditsByShotId: {},
      videoCreditsByShotId: {
        "shot-short": shortShotCredits,
        "shot-long": longShotCredits
      },
      selectedShotIds: ["shot-short", "shot-long"],
      shotIdsWithUploadedFirstFrame: new Set()
    });

    expect(totalRunCredits).toBe(shortShotCredits + longShotCredits);
    expect(totalRunCredits).not.toBe(shortShotCredits * 2);
    expect(totalRunCredits).not.toBe(longShotCredits * 2);
  });

  it("reports a Shot missing from the frame-length map as unresolved, never priced at 0 frames", () => {
    const resolvedShot = computeBulkRendersRunShotVideoCredits({
      shotId: "shot-known",
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings(),
      shotMaxFramesById: new Map([["shot-known", 48]]),
      shotFpsById: new Map()
    });
    const unresolvedShot = computeBulkRendersRunShotVideoCredits({
      shotId: "shot-unknown",
      masterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings(),
      shotMaxFramesById: new Map([["shot-known", 48]]),
      shotFpsById: new Map()
    });

    expect(resolvedShot.isFrameLengthResolved).toBe(true);
    expect(unresolvedShot.isFrameLengthResolved).toBe(false);
    expect(unresolvedShot.credits).toBe(0);
  });

  it("overrides the settings' fps with the Shot's own fps when the map has an entry", () => {
    const seedanceModel = RENDER_MODELS.find(
      (model) => model.name === VideoEngine.seedance_2
    )!;
    const seedanceMasterSettings: BulkRendersRunDraftMasterSettings = {
      ...masterSettings,
      videoModel: seedanceModel,
      videoSettings: { ...masterSettings.videoSettings, fps: 30 }
    };
    const shotMaxFramesById = new Map([["shot-1", 48]]);

    const withMasterFps = computeBulkRendersRunShotVideoCredits({
      shotId: "shot-1",
      masterSettings: seedanceMasterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings(),
      shotMaxFramesById,
      shotFpsById: new Map()
    }).credits;
    const withShotFps = computeBulkRendersRunShotVideoCredits({
      shotId: "shot-1",
      masterSettings: seedanceMasterSettings,
      draftShotVideoSettings: buildDraftShotVideoSettings(),
      shotMaxFramesById,
      shotFpsById: new Map([["shot-1", 60]])
    }).credits;

    expect(withShotFps).not.toBe(withMasterFps);
  });
});
