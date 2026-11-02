import { describe, expect, it } from "vitest";

import { minimaxH3LocalModel } from "./minimaxH3LocalModel";
import { VideoEngine, VideoSettings } from "./types";

const settingByKey = (key: string) =>
  minimaxH3LocalModel.settingsGroups
    .flatMap((group) => group.sections)
    .flatMap((section) => section.settings)
    .find((setting) => setting.key === key);

const enumOptionValues = (key: string) => {
  const setting = settingByKey(key);
  return setting?.type === "enum"
    ? setting.options.map((option) => option.value)
    : [];
};

const formatForBackend = (
  settings: VideoSettings,
  sources: { type: string; asset_id: string }[] = []
) =>
  minimaxH3LocalModel.formatValuesForBackend!(settings, {
    frameRange: [0, 120],
    fps: 24,
    sources
  } as unknown as Parameters<
    NonNullable<typeof minimaxH3LocalModel.formatValuesForBackend>
  >[1]);

describe("minimaxH3LocalModel", () => {
  it("is a local engine available to everyone", () => {
    expect(minimaxH3LocalModel.name).toBe(VideoEngine.minimax_h3_local);
    expect(minimaxH3LocalModel.status).toBe("active");
    expect(minimaxH3LocalModel.displayName).toBe("MiniMax H3 (Local)");
  });

  it("defaults Quality to high and offers high and medium", () => {
    const quality = settingByKey("h3_quality");
    expect(quality?.defaultValue).toBe("high");
    expect(enumOptionValues("h3_quality")).toEqual(["high", "medium"]);
  });

  it("replaces the output size with aspect ratio and 480p, 720p or 1080p resolution", () => {
    expect(settingByKey("max_size")).toBeUndefined();
    expect(settingByKey("aspect_ratio")?.defaultValue).toBe("9:16");
    expect(settingByKey("resolution")?.defaultValue).toBe("720p");
    expect(enumOptionValues("resolution")).toEqual(["480p", "720p", "1080p"]);
  });

  it("uses the local-or-cloud adapt prompt control", () => {
    expect(settingByKey("prompt")?.ui).toBe("PromptWithAdaptI2vButton");
    expect(settingByKey("prompt")?.specificConfig?.adaptEngine).toBe(
      VideoEngine.minimax_reference
    );
  });

  it("sizes the output from aspect ratio and short-edge resolution", () => {
    expect(
      formatForBackend({ aspect_ratio: "9:16", resolution: "720p" })
    ).toMatchObject({ width: 720, height: 1280 });
    expect(
      formatForBackend({ aspect_ratio: "16:9", resolution: "480p" })
    ).toMatchObject({ width: 856, height: 480 });
    expect(
      formatForBackend({ aspect_ratio: "16:9", resolution: "1080p" })
    ).toMatchObject({ width: 1920, height: 1080 });
  });

  it("falls back to 9:16 at 720p for values from another model", () => {
    expect(
      formatForBackend({ aspect_ratio: "auto", resolution: "4k" })
    ).toMatchObject({ width: 720, height: 1280 });
  });

  it("sends the reference images and the render duration", () => {
    expect(
      formatForBackend({}, [
        { type: "reference_frame", asset_id: "first" },
        { type: "key_frame", asset_id: "ignored" },
        { type: "reference_frame", asset_id: "second" }
      ])
    ).toMatchObject({
      image_ids: ["first", "second"],
      fps: 24,
      durationInSeconds: 5
    });
  });

  describe("VFX modes", () => {
    const isHiddenIn = (key: string, settings: Record<string, unknown>) =>
      !!settingByKey(key)?.hidingCondition?.(settings);

    it("defaults to no VFX mode and offers the six modes", () => {
      expect(settingByKey("vfx_mode")?.defaultValue).toBe("none");
      expect(enumOptionValues("vfx_mode")).toEqual([
        "none",
        "vfx_edit",
        "head_swap",
        "character_swap",
        "style_transfer"
      ]);
    });

    it("shows each mode only the settings it uses", () => {
      expect(isHiddenIn("source_image_slot", { vfx_mode: "vfx_edit" })).toBe(
        false
      );
      expect(isHiddenIn("source_image_slot", { vfx_mode: "head_swap" })).toBe(
        true
      );
      expect(isHiddenIn("image_ids", { vfx_mode: "vfx_edit" })).toBe(true);
      expect(isHiddenIn("image_ids", { vfx_mode: "head_swap" })).toBe(false);
      expect(isHiddenIn("vfx_lora_strength", { vfx_mode: "none" })).toBe(true);
      expect(isHiddenIn("aspect_ratio", { vfx_mode: "style_transfer" })).toBe(
        true
      );
      expect(isHiddenIn("aspect_ratio", { vfx_mode: "character_swap" })).toBe(
        false
      );
    });

    it("requires a reference image for the swaps", () => {
      const validateImages = settingByKey("image_ids")?.customValidation;
      expect(validateImages?.([], { vfx_mode: "head_swap" }, [])).toBe(
        "This VFX mode needs a reference image"
      );
      expect(
        validateImages?.([], { vfx_mode: "character_swap" }, [
          { type: "reference_frame", asset_id: "character" }
        ])
      ).toBeNull();
      expect(
        validateImages?.([], { vfx_mode: "style_transfer" }, [])
      ).toBeNull();
    });

    it("sends the edited frame", () => {
      expect(
        formatForBackend({ vfx_mode: "vfx_edit" }, [
          { type: "key_frame", asset_id: "edited" }
        ])
      ).toMatchObject({
        vfx_edited_frame_id: "edited"
      });
    });

    it("records which timeline frame the edited frame was taken from", () => {
      expect(
        formatForBackend(
          {
            vfx_mode: "vfx_edit",
            keyframe_index: 170,
            keyframe_index_asset_id: "edited"
          },
          [{ type: "key_frame", asset_id: "edited", index: 170 } as never]
        )
      ).toMatchObject({ vfx_edited_frame_source_frame: 170 });
      expect(
        formatForBackend(
          {
            vfx_mode: "vfx_edit",
            keyframe_index: 0,
            keyframe_index_asset_id: "edited"
          },
          [{ type: "key_frame", asset_id: "edited", index: 0 } as never]
        )
      ).toMatchObject({ vfx_edited_frame_source_frame: 0 });
    });

    it("records no source frame for an uploaded edited frame", () => {
      expect(
        formatForBackend({ vfx_mode: "vfx_edit" }, [
          { type: "key_frame", asset_id: "edited", index: 0 } as never
        ]).vfx_edited_frame_source_frame
      ).toBeUndefined();
    });

    it("sends no edited frame outside VFX edit", () => {
      const formatted = formatForBackend({ vfx_mode: "head_swap" }, [
        { type: "reference_frame", asset_id: "head" },
        { type: "key_frame", asset_id: "edited" }
      ]);
      expect(formatted).toMatchObject({ image_ids: ["head"] });
      expect(formatted.vfx_edited_frame_id).toBeUndefined();
    });

    it("keeps the source video's shape in modes that edit it", () => {
      expect(
        minimaxH3LocalModel.formatValuesForBackend!(
          {
            vfx_mode: "style_transfer",
            resolution: "720p",
            aspect_ratio: "9:16"
          },
          {
            frameRange: [0, 120],
            fps: 24,
            sources: [],
            inputVideoWidth: 1920,
            inputVideoHeight: 1080
          }
        )
      ).toMatchObject({ width: 1280, height: 720 });
    });

    it("ignores the hidden aspect ratio while the source video size is unknown", () => {
      const withHiddenAspectRatio = formatForBackend({
        vfx_mode: "style_transfer",
        resolution: "720p",
        aspect_ratio: "16:9"
      });
      const withDefaultAspectRatio = formatForBackend({
        vfx_mode: "style_transfer",
        resolution: "720p"
      });
      expect({
        width: withHiddenAspectRatio.width,
        height: withHiddenAspectRatio.height
      }).toEqual({
        width: withDefaultAspectRatio.width,
        height: withDefaultAspectRatio.height
      });
    });

    it("sends no reference images in a task that hides them", () => {
      expect(
        formatForBackend({ vfx_mode: "vfx_edit" }, [
          { type: "reference_frame", asset_id: "head" }
        ]).image_ids
      ).toEqual([]);
      expect(
        formatForBackend({ vfx_mode: "head_swap" }, [
          { type: "reference_frame", asset_id: "head" }
        ]).image_ids
      ).toEqual(["head"]);
    });
  });
});

describe("default prompt per task", () => {
  const multipurposeDefaultPrompt = settingByKey("prompt")
    ?.defaultValue as string;
  const promptAfterSwitchingTask = (task: string, currentPrompt: unknown) =>
    minimaxH3LocalModel.onValueChange?.("vfx_mode", task, {
      prompt: currentPrompt
    } as VideoSettings)?.prompt;

  it("starts Multipurpose with its example prompt", () => {
    expect(multipurposeDefaultPrompt).toMatch(/^This is a prompt example:/);
  });

  it("swaps the Multipurpose example for the Style transfer example", () => {
    const styleTransferPrompt = promptAfterSwitchingTask(
      "style_transfer",
      multipurposeDefaultPrompt
    );
    expect(styleTransferPrompt).toMatch(/^This is a prompt example:\nRestyle/);
    expect(promptAfterSwitchingTask("none", styleTransferPrompt)).toBe(
      multipurposeDefaultPrompt
    );
  });

  it("fills an empty prompt with the task's example", () => {
    expect(promptAfterSwitchingTask("style_transfer", "")).toMatch(/Restyle/);
  });

  it("replaces a prompt the user wrote, since each task needs its own", () => {
    expect(
      promptAfterSwitchingTask("style_transfer", "A watercolor street")
    ).toMatch(/Restyle/);
  });

  it("gives VFX edit, Head swap and Character swap their own examples", () => {
    expect(
      promptAfterSwitchingTask("vfx_edit", multipurposeDefaultPrompt)
    ).toMatch(/^This is a prompt example:\nAnimate the giant wave/);
    expect(
      promptAfterSwitchingTask("head_swap", multipurposeDefaultPrompt)
    ).toMatch(/^This is a prompt example:\nReplace the girl’s head/);
    expect(
      promptAfterSwitchingTask("character_swap", multipurposeDefaultPrompt)
    ).toMatch(/^This is a prompt example:\nReplace the girl in/);
  });

  it("loads an example prompt for every task", () => {
    enumOptionValues("vfx_mode").forEach((task) => {
      expect(promptAfterSwitchingTask(task, "")).toMatch(
        /^This is a prompt example:\n/
      );
    });
  });
});
