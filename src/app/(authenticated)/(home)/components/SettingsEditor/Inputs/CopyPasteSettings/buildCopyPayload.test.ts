import { SourceImage } from "@domains/renders/types";
import { magoV5_0_0RenderModel } from "@models/video/magoV5_0_0VideoModel";
import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";
import { describe, test, expect } from "vitest";

import { buildCopyPayload } from "./buildCopyPayload";

const findSetting = (model: VideoModelDefinition, key: string) =>
  flattenSettingsGroups(model)
    .flatMap((section) => section.settings)
    .find((setting) => setting.key === key);

const buildModel = (
  settings: VideoModelDefinition["settingsGroups"][number]["sections"][number]["settings"]
): VideoModelDefinition =>
  ({
    name: VideoEngine.V5_0_0,
    settingsGroups: [
      {
        name: "Group",
        level: "main",
        sections: [{ name: undefined, settings }]
      }
    ]
  }) as unknown as VideoModelDefinition;

describe("buildCopyPayload", () => {
  test("includes mago_engine and presetId", () => {
    const model = buildModel([
      {
        key: "steps",
        type: "number",
        label: "Steps",
        ui: "SliderAndNumberInput",
        defaultValue: 8
      }
    ]);

    const payload = buildCopyPayload(
      model,
      { steps: 4 } as never,
      "preset-123",
      []
    );

    expect(payload.mago_engine).toBe(VideoEngine.V5_0_0);
    expect(payload.presetId).toBe("preset-123");
  });

  test("includes both key and secondKey for paired settings", () => {
    const model = buildModel([
      {
        key: "primary_key",
        secondKey: "secondary_key",
        type: "number",
        label: "Pair",
        ui: "SliderAndNumberInput",
        defaultValue: 0
      }
    ]);

    const payload = buildCopyPayload(
      model,
      {
        primary_key: 1,
        secondary_key: 2
      } as never,
      undefined,
      []
    );

    expect(payload).toHaveProperty("primary_key", 1);
    expect(payload).toHaveProperty("secondary_key", 2);
  });

  test("Mago V5.0.0: a stored render's retired LoRA keys never reach the copy payload", () => {
    const feState = magoV5_0_0RenderModel.formatValuesForFrontend!({
      lora_1: 0.7,
      lora_weight_1: 0.3,
      custom_loras: [{ lora_name: "any_lora", lora_strength: 0.9 }],
      steps: 8
    } as never);
    const payload = buildCopyPayload(
      magoV5_0_0RenderModel,
      feState,
      undefined,
      []
    );

    expect(payload).not.toHaveProperty("lora_1");
    expect(payload).not.toHaveProperty("lora_weight_1");
    expect(payload).not.toHaveProperty("custom_loras");
    expect(payload.steps).toBe(8);
  });

  test("excludes keys not present in renderSettings", () => {
    const model = buildModel([
      {
        key: "steps",
        type: "number",
        label: "Steps",
        ui: "SliderAndNumberInput",
        defaultValue: 8
      },
      {
        key: "cfg",
        type: "number",
        label: "CFG",
        ui: "SliderAndNumberInput",
        defaultValue: 1
      }
    ]);

    const payload = buildCopyPayload(
      model,
      { steps: 8 } as never,
      undefined,
      []
    );

    expect(payload.steps).toBe(8);
    expect(payload).not.toHaveProperty("cfg");
  });

  test("returns an empty sources array when none are provided", () => {
    const model = buildModel([
      {
        key: "steps",
        type: "number",
        label: "Steps",
        ui: "SliderAndNumberInput",
        defaultValue: 8
      }
    ]);

    const payload = buildCopyPayload(
      model,
      { steps: 8 } as never,
      undefined,
      []
    );

    expect(payload.sources).toEqual([]);
  });

  test("serialises a single reference_frame source", () => {
    const model = buildModel([
      {
        key: "steps",
        type: "number",
        label: "Steps",
        ui: "SliderAndNumberInput",
        defaultValue: 8
      }
    ]);
    const sources: SourceImage[] = [
      { asset_id: "ref-uuid", type: "reference_frame" }
    ];

    const payload = buildCopyPayload(
      model,
      { steps: 8 } as never,
      undefined,
      sources
    );

    expect(payload.sources).toEqual(sources);
  });

  test("serialises multiple sources including categorised reference_frames and key_frames", () => {
    const model = buildModel([
      {
        key: "steps",
        type: "number",
        label: "Steps",
        ui: "SliderAndNumberInput",
        defaultValue: 8
      }
    ]);
    const sources: SourceImage[] = [
      { asset_id: "ref-1", type: "reference_frame" },
      { asset_id: "ref-2", type: "reference_frame" },
      { asset_id: "key-1", type: "key_frame", index: 0 },
      { asset_id: "key-2", type: "key_frame", index: 12 }
    ];

    const payload = buildCopyPayload(
      model,
      { steps: 8 } as never,
      undefined,
      sources
    );

    expect(payload.sources).toEqual(sources);
  });
});
