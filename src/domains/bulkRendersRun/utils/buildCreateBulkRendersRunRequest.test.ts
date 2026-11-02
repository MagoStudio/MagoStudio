import {
  Img2ImgSchema,
  Img2ImgType
} from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { RenderMode } from "@hooks/types";
import { magoV3_3_0_cnetsRenderModel } from "@models/video/magoV3_3_0_cnetsVideoModel";
import { magoV5_0_0RenderModel } from "@models/video/magoV5_0_0VideoModel";
import { VideoEngine, VideoSettings } from "@models/video/types";
import {
  BULK_RENDERS_RUN_NAME_MAX_LENGTH,
  CreateBulkRendersRunRequestSchema
} from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import {
  BuildCreateBulkRendersRunRequestInput,
  buildCreateBulkRendersRunRequest,
  FRONTEND_ONLY_SETTING_KEYS
} from "./buildCreateBulkRendersRunRequest";

const buildImageSettings = (
  overrides: Record<string, unknown> = {}
): Img2ImgType =>
  Img2ImgSchema.parse({
    model: "gpt_image_2",
    frameType: "video",
    ...overrides
  });

const buildBaseInput = (
  overrides: Partial<BuildCreateBulkRendersRunRequestInput> = {}
): BuildCreateBulkRendersRunRequestInput => ({
  projectId: "project-1",
  selectedShotIds: ["shot-1", "shot-2"],
  name: "Bulk 1_My film",
  renderSettingsValues: {
    steps: 20,
    denoise: 0.5
  } as VideoSettings,
  videoModel: magoV3_3_0_cnetsRenderModel,
  renderEngine: VideoEngine.V3_3_0_CNETS,
  renderMode: RenderMode.CREDITS,
  frameRange: [0, 48],
  imageSettings: buildImageSettings(),
  imagePrompt: "stylize into anime",
  imageRenderModel: "gpt_image_2",
  imageReferenceAssetIds: ["asset-1", "asset-2"],
  isTeamMember: false,
  firstFrameSource: "generated",
  isFullFrameRangePresetSelected: false,
  shotMaxFramesById: new Map(),
  ...overrides
});

describe("buildCreateBulkRendersRunRequest", () => {
  it("carries the Project id, selected Shot ids and name", () => {
    const request = buildCreateBulkRendersRunRequest(buildBaseInput());

    expect(request.project_id).toBe("project-1");
    expect(request.timeline_ids).toEqual(["shot-1", "shot-2"]);
    expect(request.name).toBe("Bulk 1_My film");
  });

  it("maps the panel's values into video_settings with the engine, render_mode and frame_range", () => {
    const request = buildCreateBulkRendersRunRequest(buildBaseInput());

    expect(request.video_settings).toEqual({
      steps: 20,
      denoise: 0.5,
      convert_exrs_to_pngs: true,
      enable_facemesh_blending: false,
      engine: VideoEngine.V3_3_0_CNETS,
      render_mode: RenderMode.CREDITS,
      frame_range: [0, 48]
    });
  });

  it("strips every frontend-only key from video_settings before sending", () => {
    /* `mago_engine` is excluded deliberately: it is frontend-only AND the engine's source, so a
     * dummy value here would assert against its own resolution. Its two properties are covered
     * by the two tests below. */
    const frontendOnlyValues = Object.fromEntries(
      FRONTEND_ONLY_SETTING_KEYS.filter((key) => key !== "mago_engine").map(
        (key) => [key, "frontend-only-value"]
      )
    ) as VideoSettings;

    const request = buildCreateBulkRendersRunRequest(
      buildBaseInput({
        renderSettingsValues: { steps: 20, ...frontendOnlyValues }
      })
    );

    expect(request.video_settings).toEqual({
      steps: 20,
      convert_exrs_to_pngs: true,
      enable_facemesh_blending: false,
      engine: VideoEngine.V3_3_0_CNETS,
      render_mode: RenderMode.CREDITS,
      frame_range: [0, 48]
    });
  });

  it("sends the engine the settings resolve to, not the selected model's name", () => {
    const request = buildCreateBulkRendersRunRequest(
      buildBaseInput({
        renderSettingsValues: {
          steps: 20,
          mago_engine: VideoEngine.V4_1_0
        } as VideoSettings
      })
    );

    expect(request.video_settings?.engine).toBe(VideoEngine.V4_1_0);
    expect(request.video_settings).not.toHaveProperty("mago_engine");
  });

  it("falls back to the selected model's name when the settings resolve no engine", () => {
    const request = buildCreateBulkRendersRunRequest(buildBaseInput());

    expect(request.video_settings?.engine).toBe(VideoEngine.V3_3_0_CNETS);
  });

  it("sends a non-empty img2img_settings mapping prompt, render model, render mode, reference images and the file type", () => {
    const request = buildCreateBulkRendersRunRequest(buildBaseInput());

    expect(request.img2img_settings).toEqual({
      num_images: 1,
      quality: "medium",
      prompt: "stylize into anime",
      render_model: "gpt_image_2",
      render_mode: RenderMode.CREDITS,
      reference_images: ["asset-1", "asset-2"],
      img_file_type: "jpg"
    });
  });

  it("runs the selected video model's own FE-to-BE adapter, so Mago V5.0.0 sends an empty custom_loras array and no retired lora key reaches the wire", () => {
    const request = buildCreateBulkRendersRunRequest(
      buildBaseInput({
        videoModel: magoV5_0_0RenderModel,
        renderEngine: VideoEngine.V5_0_0,
        renderSettingsValues: { lora_1: 0.8, steps: 4 } as VideoSettings
      })
    );

    expect(request.video_settings?.custom_loras).toEqual([]);
    expect(request.video_settings?.lora_1).toBeUndefined();
  });

  it("never carries a mask image id into img2img_settings, since one drawn mask cannot apply to every Shot in the run", () => {
    const request = buildCreateBulkRendersRunRequest(
      buildBaseInput({
        imageSettings: buildImageSettings({ maskImages: ["mask-asset-1"] })
      })
    );

    expect(request.img2img_settings).not.toHaveProperty("mask_image_id");
  });

  it("carries the same render_mode into img2img_settings as video_settings so unlimited-mode users are not charged credits for the image chain", () => {
    const request = buildCreateBulkRendersRunRequest(
      buildBaseInput({ renderMode: RenderMode.UNLIMITED })
    );

    expect(request.img2img_settings?.render_mode).toBe(RenderMode.UNLIMITED);
    expect(request.video_settings?.render_mode).toBe(RenderMode.UNLIMITED);
  });

  it("omits img2img_settings entirely for a video-only engine", () => {
    const request = buildCreateBulkRendersRunRequest(
      buildBaseInput({ renderEngine: VideoEngine.V7_0_0 })
    );

    expect(request.img2img_settings).toBeUndefined();
  });

  it("sends a non-empty img2img_settings, with render_model and render_mode present, even when the panel supplies no image values", () => {
    const request = buildCreateBulkRendersRunRequest(
      buildBaseInput({
        imagePrompt: "",
        imageRenderModel: "gpt_image_2",
        imageReferenceAssetIds: []
      })
    );

    expect(request.img2img_settings).toBeDefined();
    expect(Object.keys(request.img2img_settings ?? {}).length).toBeGreaterThan(
      0
    );
    expect(request.img2img_settings?.render_model).toBe("gpt_image_2");
    expect(request.img2img_settings?.render_mode).toBe(RenderMode.CREDITS);
  });

  it("truncates a name exceeding the backend column limit, keeping the leading identity intact", () => {
    const request = buildCreateBulkRendersRunRequest(
      buildBaseInput({ name: `Bulk 3_${"a".repeat(250)}` })
    );

    const truncatedName = request.name ?? "";
    expect(truncatedName).toHaveLength(BULK_RENDERS_RUN_NAME_MAX_LENGTH);
    expect(truncatedName.startsWith("Bulk 3_")).toBe(true);
    expect(truncatedName).toBe(
      `Bulk 3_${"a".repeat(250)}`.slice(0, BULK_RENDERS_RUN_NAME_MAX_LENGTH)
    );
  });

  it("truncates a name with astral characters by code point, never splitting a surrogate pair", () => {
    const surrogatePairEmoji = "🎬";
    const oddLengthPrefix = "a";
    const name = oddLengthPrefix + surrogatePairEmoji.repeat(250);

    const request = buildCreateBulkRendersRunRequest(buildBaseInput({ name }));
    const truncatedName = request.name ?? "";

    // oxlint-disable-next-line typescript/no-misused-spread -- asserting the code-point count is exactly the property under test
    expect([...truncatedName]).toHaveLength(BULK_RENDERS_RUN_NAME_MAX_LENGTH);
    expect(truncatedName).toBe(
      oddLengthPrefix + surrogatePairEmoji.repeat(199)
    );
  });

  it("produces a request whose all-astral truncated name still parses through CreateBulkRendersRunRequestSchema, since the schema's UTF-16-unit max must tolerate 200 code points of astral characters", () => {
    const surrogatePairEmoji = "🎬";
    const name = surrogatePairEmoji.repeat(
      BULK_RENDERS_RUN_NAME_MAX_LENGTH * 2
    );

    const request = buildCreateBulkRendersRunRequest(buildBaseInput({ name }));

    expect(() =>
      CreateBulkRendersRunRequestSchema.parse(request)
    ).not.toThrow();
  });

  describe("shot_overrides", () => {
    it("carries no shot_overrides when no Shot prompt was edited", () => {
      const request = buildCreateBulkRendersRunRequest(buildBaseInput());

      expect(request.shot_overrides).toBeUndefined();
    });

    it("carries a shot_overrides entry only for the Shot whose prompt was edited", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": { videoPrompt: "a different clip" }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": { video_settings: { prompt: "a different clip" } }
      });
    });

    it("never carries an entry for a Shot that was edited then deselected — shot_overrides tracks only SELECTED Shots", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          selectedShotIds: ["shot-1"],
          shotSettingsOverrideById: {
            "shot-1": { videoPrompt: "a different clip" },
            "shot-2": {
              videoPrompt: "an edit from before shot-2 was deselected"
            }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": { video_settings: { prompt: "a different clip" } }
      });
      expect(request.shot_overrides?.["shot-2"]).toBeUndefined();
    });

    it("carries both the image and video prompt overrides for one Shot when both were edited", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": {
              imagePrompt: "a different frame",
              videoPrompt: "a different clip"
            }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": {
          img2img_settings: { prompt: "a different frame" },
          video_settings: { prompt: "a different clip" }
        }
      });
    });

    it("sends an image source frame override as img2img_settings.frame", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": { imageSourceFrame: 120 }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": { img2img_settings: { frame: 120 } }
      });
    });

    it("omits a Shot entry whose override object carries neither prompt", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": {}
          }
        })
      );

      expect(request.shot_overrides).toBeUndefined();
    });

    it("sends a per-Shot reference image list as img2img_settings.reference_images", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": { imageReferenceAssetIds: ["asset-9"] }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": { img2img_settings: { reference_images: ["asset-9"] } }
      });
    });

    it("sends an emptied per-Shot reference image list as an explicit empty array", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": { imageReferenceAssetIds: [] }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": { img2img_settings: { reference_images: [] } }
      });
    });

    it("puts a Shot's prompt and reference images in the same img2img_settings object", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": {
              imagePrompt: "a different frame",
              imageReferenceAssetIds: ["asset-9"]
            }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": {
          img2img_settings: {
            prompt: "a different frame",
            reference_images: ["asset-9"]
          }
        }
      });
    });

    it("never pairs a shot override's img2img_settings with an images key", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": { imageReferenceAssetIds: ["asset-9"] }
          }
        })
      );

      expect(request.shot_overrides?.["shot-1"]).not.toHaveProperty("images");
    });

    it("sends a supplied first frame as images, with no img2img_settings, for that Shot alone", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": { uploadedFirstFrameAssetId: "asset-uploaded" }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": {
          images: [{ asset_id: "asset-uploaded", type: "reference_frame" }]
        }
      });
    });

    it("never emits img2img_settings for an uploaded-first-frame Shot even when image-chain overrides are also present", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": {
              uploadedFirstFrameAssetId: "asset-uploaded",
              imagePrompt: "should never reach the wire",
              imageReferenceAssetIds: ["asset-should-be-dropped"],
              imageSettings: buildImageSettings(),
              imageSourceFrame: 42
            }
          }
        })
      );

      expect(request.shot_overrides?.["shot-1"]).not.toHaveProperty(
        "img2img_settings"
      );
      expect(request.shot_overrides?.["shot-1"]).toEqual({
        images: [{ asset_id: "asset-uploaded", type: "reference_frame" }]
      });
    });

    it("still carries a Shot's video settings override alongside its uploaded first frame", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": {
              uploadedFirstFrameAssetId: "asset-uploaded",
              videoSettingsPatch: { steps: 30 }
            }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": {
          images: [{ asset_id: "asset-uploaded", type: "reference_frame" }],
          video_settings: { steps: 30 }
        }
      });
    });

    it("mixes a supplied-frame Shot and a generated-frame Shot in the same run, each keeping its own shape", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": { uploadedFirstFrameAssetId: "asset-uploaded" },
            "shot-2": { imagePrompt: "generate this one" }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": {
          images: [{ asset_id: "asset-uploaded", type: "reference_frame" }]
        },
        "shot-2": { img2img_settings: { prompt: "generate this one" } }
      });
      expect(request.shot_overrides?.["shot-1"]).not.toHaveProperty(
        "img2img_settings"
      );
      expect(request.shot_overrides?.["shot-2"]).not.toHaveProperty("images");
      expect(() =>
        CreateBulkRendersRunRequestSchema.parse(request)
      ).not.toThrow();
    });

    it("throws rather than silently generating an image for a supplied-frames run with an unfilled selected Shot", () => {
      expect(() =>
        buildCreateBulkRendersRunRequest(
          buildBaseInput({
            firstFrameSource: "uploaded",
            selectedShotIds: ["shot-1", "shot-2"],
            shotSettingsOverrideById: {
              "shot-1": { uploadedFirstFrameAssetId: "asset-uploaded" }
            }
          })
        )
      ).toThrow(/shot-2/);
    });

    it("does not throw for a supplied-frames run where every selected Shot has an uploaded first frame", () => {
      expect(() =>
        buildCreateBulkRendersRunRequest(
          buildBaseInput({
            firstFrameSource: "uploaded",
            selectedShotIds: ["shot-1", "shot-2"],
            shotSettingsOverrideById: {
              "shot-1": { uploadedFirstFrameAssetId: "asset-1" },
              "shot-2": { uploadedFirstFrameAssetId: "asset-2" }
            }
          })
        )
      ).not.toThrow();
    });

    it("carries a Shot's video settings patch under video_settings", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": { videoSettingsPatch: { steps: 30, denoise: 0.7 } }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": { video_settings: { steps: 30, denoise: 0.7 } }
      });
    });

    it("strips frontend-only keys from a Shot's video settings patch before sending", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": {
              videoSettingsPatch: {
                steps: 30,
                mago_engine: VideoEngine.V4_1_0
              } as VideoSettings
            }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": { video_settings: { steps: 30 } }
      });
    });

    it("strips the FULL frontend-only key set from a Shot's video settings patch, not just the two named above — iterating the constant so an added key that's never added to the stripper fails here", () => {
      const frontendOnlyValues = Object.fromEntries(
        FRONTEND_ONLY_SETTING_KEYS.filter((key) => key !== "mago_engine").map(
          (key) => [key, "frontend-only-value"]
        )
      ) as VideoSettings;

      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": {
              videoSettingsPatch: { steps: 30, ...frontendOnlyValues }
            }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": { video_settings: { steps: 30 } }
      });
    });

    it("omits a Shot entry whose video settings patch is empty and carries no other override", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          shotSettingsOverrideById: {
            "shot-1": { videoSettingsPatch: {} }
          }
        })
      );

      expect(request.shot_overrides).toBeUndefined();
    });
  });

  describe("Full frame-range preset", () => {
    it("sends each selected Shot its own full length when Full was active at draft open", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          isFullFrameRangePresetSelected: true,
          shotMaxFramesById: new Map([
            ["shot-1", 20],
            ["shot-2", 40]
          ])
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": { video_settings: { frame_range: [0, 20] } },
        "shot-2": { video_settings: { frame_range: [0, 40] } }
      });
      expect(request.video_settings?.frame_range).toEqual([0, 48]);
    });

    it("carries no shot_overrides frame_range when Full was not active, and no shot_overrides at all with no other edits", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          isFullFrameRangePresetSelected: false,
          shotMaxFramesById: new Map([
            ["shot-1", 20],
            ["shot-2", 40]
          ])
        })
      );

      expect(request.shot_overrides).toBeUndefined();
      expect(request.video_settings?.frame_range).toEqual([0, 48]);
    });

    it("merges a Shot's own full length with that Shot's other overrides", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          isFullFrameRangePresetSelected: true,
          shotMaxFramesById: new Map([
            ["shot-1", 20],
            ["shot-2", 40]
          ]),
          shotSettingsOverrideById: {
            "shot-1": { videoPrompt: "a different clip" }
          }
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": {
          video_settings: {
            prompt: "a different clip",
            frame_range: [0, 20]
          }
        },
        "shot-2": { video_settings: { frame_range: [0, 40] } }
      });
    });

    it("sends no frame_range override for a Shot whose length is unknown", () => {
      const request = buildCreateBulkRendersRunRequest(
        buildBaseInput({
          isFullFrameRangePresetSelected: true,
          shotMaxFramesById: new Map([["shot-1", 20]])
        })
      );

      expect(request.shot_overrides).toEqual({
        "shot-1": { video_settings: { frame_range: [0, 20] } }
      });
      expect(request.shot_overrides?.["shot-2"]).toBeUndefined();
    });
  });
});
