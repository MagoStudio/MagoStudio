import { describe, expect, it, test } from "vitest";

import { Setting } from "../shared/types";

import { extractDefaultVideoSettings } from "./extractDefaultVideoSettings";
import { VideoSettings } from "./types";
import { flattenSettingsGroups } from "./utils/flattenSettingsGroups";
import { v5_1_0InpaintingRenderModel } from "./v5_1_0InpaintingVideoModel";

const findSetting = (key: string): Setting | undefined =>
  flattenSettingsGroups(v5_1_0InpaintingRenderModel)
    .flatMap((section) => section.settings)
    .find((s) => s.key === key);

const context = {
  inputVideoWidth: 1024,
  inputVideoHeight: 576,
  frameRange: [0, 24] as number[],
  fps: 24,
  sources: []
};

const runFormat = (settings: Partial<VideoSettings>) =>
  v5_1_0InpaintingRenderModel.formatValuesForBackend!(
    settings as VideoSettings,
    context
  );

describe("v5_1_0InpaintingRenderModel.formatValuesForBackend", () => {
  test("derives split_step from default total_steps and split_step_percentage", () => {
    const result = runFormat({
      total_steps: 6,
      split_step_percentage: 40,
      lora_strength: 1
    });

    expect(result.split_step).toBe(4);
    expect(result.split_step_percentage).toBe(40);
    expect(result.total_steps).toBe(6);
    expect(result.lora_strength).toBe(1);
  });

  test("derives split_step for a high level of detail", () => {
    const result = runFormat({
      total_steps: 10,
      split_step_percentage: 80
    });

    expect(result.split_step).toBe(2);
  });

  test("derives split_step for a low level of detail", () => {
    const result = runFormat({
      total_steps: 10,
      split_step_percentage: 20
    });

    expect(result.split_step).toBe(8);
  });

  test("rounds non-integer products via Math.round", () => {
    const result = runFormat({
      total_steps: 7,
      split_step_percentage: 50
    });

    expect(result.split_step).toBe(4);
  });

  test("injects width and height from context", () => {
    const result = runFormat({
      total_steps: 6,
      split_step_percentage: 40
    });

    expect(result.width).toBe(1024);
    expect(result.height).toBe(576);
  });

  test("falls back to defaults when settings are missing", () => {
    const result = runFormat({});

    expect(result.split_step).toBe(Math.round(6 * (1 - 40 / 100)));
    expect(result.split_step_percentage).toBe(40);
    expect(result.total_steps).toBe(6);
  });

  test("model defaults flow through formatValuesForBackend (lora_strength still on wire)", () => {
    const defaults = extractDefaultVideoSettings(
      v5_1_0InpaintingRenderModel
    ) as VideoSettings;
    const result = v5_1_0InpaintingRenderModel.formatValuesForBackend!(
      defaults,
      context
    );

    expect(result.lora_strength).toBe(1);
    expect(result.split_step_percentage).toBe(40);
    expect(result.split_step).toBe(Math.round(6 * (1 - 40 / 100)));
    expect(result.total_steps).toBe(6);
  });

  test("derives split_step at slider boundaries with default total_steps", () => {
    expect(
      runFormat({ total_steps: 6, split_step_percentage: 20 }).split_step
    ).toBe(5);
    expect(
      runFormat({ total_steps: 6, split_step_percentage: 80 }).split_step
    ).toBe(1);
  });

  test("omits mask_prompt from the payload when input_mask is set", () => {
    const result = runFormat({
      total_steps: 6,
      split_step_percentage: 40,
      input_mask: "mask-track-id",
      mask_prompt: "a person"
    });

    expect(result).not.toHaveProperty("mask_prompt");
    expect(result.input_mask).toBe("mask-track-id");
  });

  test("keeps mask_prompt in the payload when input_mask is unset", () => {
    const result = runFormat({
      total_steps: 6,
      split_step_percentage: 40,
      mask_prompt: "a person"
    });

    expect(result.mask_prompt).toBe("a person");
  });

  test("keeps mask_prompt in the payload when input_mask is an empty string", () => {
    const result = runFormat({
      total_steps: 6,
      split_step_percentage: 40,
      input_mask: "",
      mask_prompt: "a person"
    });

    expect(result.mask_prompt).toBe("a person");
  });
});

describe("v5_1_0InpaintingRenderModel — Main group empty-state gating", () => {
  const findSection = (key: string) => {
    const mainGroup = v5_1_0InpaintingRenderModel.settingsGroups.find(
      (group) => group.level === "main"
    )!;
    return mainGroup.sections.find((section) =>
      section.settings.some((setting) => setting.key === key)
    )!;
  };

  it("the frame control's own section has no hidingCondition (the only way out of the empty state)", () => {
    const frameSection = findSection("source_image_slot");
    expect(frameSection.hidingCondition).toBeUndefined();
  });

  it.each(["mask_prompt", "input_mask", "grow_mask_expand", "prompt"])(
    "%s's section is hidden with no reference frame and visible once one exists",
    (key) => {
      const section = findSection(key);
      expect(section.hidingCondition?.({}, false)).toBe(true);
      expect(
        section.hidingCondition?.({ source_image_slot: "asset-a" }, false)
      ).toBe(false);
    }
  );

  it("the Mask settings section is the isNamedCollapsible one and shares the empty-state gate", () => {
    const section = findSection("grow_mask_expand");
    expect(section.isNamedCollapsible).toBe(true);
    expect(section.name).toBe("titles.mask_settings.label");
  });

  it("mask_prompt hides when input_mask is set, independent of frame presence", () => {
    const maskPrompt = findSetting("mask_prompt");
    expect(
      maskPrompt?.hidingCondition?.(
        { source_image_slot: "asset-a", input_mask: "mask-track" },
        false
      )
    ).toBe(true);
    expect(
      maskPrompt?.hidingCondition?.({ source_image_slot: "asset-a" }, false)
    ).toBe(false);
  });

  it("input_mask hides when unset, independent of frame presence", () => {
    const inputMask = findSetting("input_mask");
    expect(
      inputMask?.hidingCondition?.({ source_image_slot: "asset-a" }, false)
    ).toBe(true);
    expect(
      inputMask?.hidingCondition?.(
        { source_image_slot: "asset-a", input_mask: "mask-track" },
        false
      )
    ).toBe(false);
  });
});
