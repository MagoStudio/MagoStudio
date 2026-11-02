import { VideoEngine } from "@models/video/types";
import { Clip } from "@schemas/clip";
import { Layer } from "@schemas/layer";
import { createAsset } from "@tests/factories/asset";
import { createClip } from "@tests/factories/clip";
import { describe, it, expect } from "vitest";

import { getSettingsToDisplay } from "./getSettingsToDisplay";

describe("getSettingsToDisplay", () => {
  const createMockLayer = (
    id: string,
    renderSettings: any = {},
    hasSettings = true
  ): Layer => ({
    id,
    active: true,
    clips: [
      createClip({
        asset: createAsset({
          data: {
            data: hasSettings
              ? { render_settings: { magov2: renderSettings } }
              : (undefined as any)
          }
        })
      }) as unknown as Clip
    ],
    created_at: new Date("2024-01-01"),
    data: {
      duration: 10,
      processed: true,
      fps: 30,
      size: [512, 512],
      renderSettings: hasSettings
        ? { magov2: renderSettings }
        : (undefined as any),
      renderEngine: "magov2" as const,
      parent_render: "parent-id",
      thumbnails: []
    },
    layer_order: 1,
    muted: false,
    name: `Layer ${id}`,
    rating: 0,
    timeline_id: "timeline-1",
    type: "render" as any,
    user_id: "user-1",
    visible: true
  });

  describe("edge cases", () => {
    it("should handle empty array", () => {
      const result = getSettingsToDisplay([], {});
      expect(result).toEqual([]);
    });

    it("should handle array with only undefined layers", () => {
      const result = getSettingsToDisplay([undefined, undefined], {});
      expect(result).toEqual([[], []]);
    });

    it("should handle layers without render settings", () => {
      const layer1 = createMockLayer("1", {}, false);
      const layer2 = createMockLayer("2", {}, false);

      const result = getSettingsToDisplay([layer1, layer2], {});
      expect(result).toEqual([[], []]);
    });

    it("should handle layers with empty render settings", () => {
      const layer1 = createMockLayer("1", {});
      const layer2 = createMockLayer("2", {});

      const result = getSettingsToDisplay([layer1, layer2], {});
      expect(result).toEqual([[], []]);
    });

    it("should handle mix of undefined and valid layers", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8
      });

      const result = getSettingsToDisplay([undefined, layer1, undefined], {});
      expect(result).toEqual([[], [], []]);
    });
  });

  describe("different engines scenario", () => {
    it("should return only model names when layers have different engines", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V2_5_0,
        color_match_strength: 0.6
      });

      const result = getSettingsToDisplay([layer1, layer2], {});

      expect(result).toEqual([
        [["Model", "Mago V3.3"]],
        [["Model", "Mago Dreamlike (slow)"]]
      ]);
    });

    it("should handle mix of layers with and without settings when engines differ", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0
      });
      const layer2 = createMockLayer("2", {}, false);
      const layer3 = createMockLayer("3", {
        mago_engine: VideoEngine.V2_5_0
      });

      const result = getSettingsToDisplay([layer1, layer2, layer3], {});

      expect(result).toEqual([
        [["Model", "Mago V3.3"]],
        [],
        [["Model", "Mago Dreamlike (slow)"]]
      ]);
    });

    it("should include character variant labels for Mago character engines", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V4_0_0
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V4_1_0
      });

      const result = getSettingsToDisplay([layer1, layer2], {});

      expect(result).toEqual([
        [["Model", "Mago character (chara only)"]],
        [["Model", "Mago character (w/ background)"]]
      ]);
    });
  });

  describe("same engine scenario", () => {
    it("should return only differing settings when engines are the same", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        cfg: 7.5,
        steps: 20
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.6,
        cfg: 7.5,
        steps: 25
      });

      const result = getSettingsToDisplay([layer1, layer2], {});

      expect(result).toEqual([
        [
          ["Steps", 20],
          ["Color consistency", 0.8]
        ],
        [
          ["Steps", 25],
          ["Color consistency", 0.6]
        ]
      ]);
    });

    it("should return empty arrays when all settings are identical", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        cfg: 7.5
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        cfg: 7.5
      });

      const result = getSettingsToDisplay([layer1, layer2], {});

      expect(result).toEqual([[], []]);
    });

    it("should handle layers with different sets of settings", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        cfg: 7.5
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        steps: 20
      });

      const result = getSettingsToDisplay([layer1, layer2], {});

      expect(result).toEqual([
        [
          ["Steps", "n/a"],
          ["CFG", 7.5]
        ],
        [
          ["Steps", 20],
          ["CFG", "n/a"]
        ]
      ]);
    });
  });

  describe("value formatting", () => {
    it("should format boolean values correctly", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        control_type: "depth"
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V3_3_0,
        control_type: "pose"
      });

      const result = getSettingsToDisplay([layer1, layer2], {});

      expect(result).toEqual([[["Type", "depth"]], [["Type", "pose"]]]);
    });

    it("should format array values with hyphen", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        custom_setting: [10, 20]
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V3_3_0,
        custom_setting: [15, 25]
      });

      const result = getSettingsToDisplay([layer1, layer2], {});

      expect(result).toEqual([[], []]);
    });

    it("should format null and undefined values as 'n/a'", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: null,
        cfg: undefined
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        cfg: 7.5
      });

      const result = getSettingsToDisplay([layer1, layer2], {});

      expect(result).toEqual([
        [
          ["CFG", "n/a"],
          ["Color consistency", "n/a"]
        ],
        [
          ["CFG", 7.5],
          ["Color consistency", 0.8]
        ]
      ]);
    });

    it("should preserve numeric and string values", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        prompt: "value1"
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.6,
        prompt: "value2"
      });

      const result = getSettingsToDisplay([layer1, layer2], {});

      expect(result).toEqual([
        [
          ["Prompt", "value1"],
          ["Color consistency", 0.8]
        ],
        [
          ["Prompt", "value2"],
          ["Color consistency", 0.6]
        ]
      ]);
    });
  });

  describe("engine fallback for labels", () => {
    it("should use engine from layer with settings for label resolution", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8
      });
      const layer2 = createMockLayer("2", {
        color_match_strength: 0.6
      });

      const result = getSettingsToDisplay([layer1, layer2], {});

      expect(result).toEqual([
        [["Color consistency", 0.8]],
        [["Color consistency", 0.6]]
      ]);
    });
  });

  describe("mixed empty and non-empty layers", () => {
    it("should handle one empty layer and one non-empty layer", () => {
      const emptyLayer = createMockLayer("1", {}, false);
      const nonEmptyLayer = createMockLayer("2", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8
      });

      const result = getSettingsToDisplay([emptyLayer, nonEmptyLayer], {});

      expect(result).toEqual([[], []]);
    });

    it("should handle four layers with one empty", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        cfg: 7.5
      });
      const emptyLayer = createMockLayer("2", {}, false);
      const layer3 = createMockLayer("3", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.6,
        cfg: 7.5
      });
      const layer4 = createMockLayer("4", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.7,
        cfg: 10.0
      });

      const result = getSettingsToDisplay(
        [layer1, emptyLayer, layer3, layer4],
        {}
      );

      expect(result).toEqual([
        [
          ["CFG", 7.5],
          ["Color consistency", 0.8]
        ],
        [],
        [
          ["CFG", 7.5],
          ["Color consistency", 0.6]
        ],
        [
          ["CFG", 10.0],
          ["Color consistency", 0.7]
        ]
      ]);
    });

    it("should handle multiple empty layers mixed with non-empty ones", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8
      });
      const emptyLayer1 = createMockLayer("2", {}, false);
      const emptyLayer2 = createMockLayer("3", {}, false);
      const layer4 = createMockLayer("4", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.6
      });

      const result = getSettingsToDisplay(
        [layer1, emptyLayer1, emptyLayer2, layer4],
        {}
      );

      expect(result).toEqual([
        [["Color consistency", 0.8]],
        [],
        [],
        [["Color consistency", 0.6]]
      ]);
    });

    it("should handle empty layers at different positions", () => {
      const emptyLayer1 = createMockLayer("1", {}, false);
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        cfg: 7.5
      });
      const emptyLayer3 = createMockLayer("3", {}, false);
      const layer4 = createMockLayer("4", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.6,
        cfg: 10.0
      });
      const emptyLayer5 = createMockLayer("5", {}, false);

      const result = getSettingsToDisplay(
        [emptyLayer1, layer2, emptyLayer3, layer4, emptyLayer5],
        {}
      );

      expect(result).toEqual([
        [],
        [
          ["CFG", 7.5],
          ["Color consistency", 0.8]
        ],
        [],
        [
          ["CFG", 10.0],
          ["Color consistency", 0.6]
        ],
        []
      ]);
    });

    it("should handle mixed empty layers with different engines", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8
      });
      const emptyLayer = createMockLayer("2", {}, false);
      const layer3 = createMockLayer("3", {
        mago_engine: VideoEngine.V2_5_0,
        color_match_strength: 0.6
      });

      const result = getSettingsToDisplay([layer1, emptyLayer, layer3], {});

      expect(result).toEqual([
        [["Model", "Mago V3.3"]],
        [],
        [["Model", "Mago Dreamlike (slow)"]]
      ]);
    });
  });

  describe("complex scenarios", () => {
    it("should handle multiple layers with mixed settings", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        cfg: 7.5,
        control_type: "depth"
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.6,
        cfg: 7.5,
        steps: 20
      });
      const layer3 = createMockLayer("3", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8,
        cfg: 10.0,
        control_type: "pose",
        steps: 20
      });

      const result = getSettingsToDisplay([layer1, layer2, layer3], {});

      expect(result).toEqual([
        [
          ["Type", "depth"],
          ["Steps", "n/a"],
          ["CFG", 7.5],
          ["Color consistency", 0.8]
        ],
        [
          ["Type", "n/a"],
          ["Steps", 20],
          ["CFG", 7.5],
          ["Color consistency", 0.6]
        ],
        [
          ["Type", "pose"],
          ["Steps", 20],
          ["CFG", 10.0],
          ["Color consistency", 0.8]
        ]
      ]);
    });

    it("should handle layers where some have no settings", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.8
      });
      const layer2 = createMockLayer("2", {}, false);
      const layer3 = createMockLayer("3", {
        mago_engine: VideoEngine.V3_3_0,
        color_match_strength: 0.6
      });

      const result = getSettingsToDisplay([layer1, layer2, layer3], {});

      expect(result).toEqual([
        [["Color consistency", 0.8]],
        [],
        [["Color consistency", 0.6]]
      ]);
    });

    it("should replace asset IDs with asset names when assetNameMap is provided", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V2_5_0,
        source_image_slot: "asset-id-123"
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V2_5_0,
        source_image_slot: "asset-id-456"
      });

      const assetNameMap = {
        "asset-id-123": "My Style Image.jpg",
        "asset-id-456": "Another Image.png"
      };

      const result = getSettingsToDisplay([layer1, layer2], assetNameMap);

      expect(result).toEqual([
        [["Image style reference", "My Style Image.jpg"]],
        [["Image style reference", "Another Image.png"]]
      ]);
    });

    it("should use asset ID as fallback when asset name is not in map", () => {
      const layer1 = createMockLayer("1", {
        mago_engine: VideoEngine.V2_5_0,
        source_image_slot: "asset-id-123"
      });
      const layer2 = createMockLayer("2", {
        mago_engine: VideoEngine.V2_5_0,
        source_image_slot: "asset-id-456"
      });

      const assetNameMap = {
        "asset-id-123": "My Style Image.jpg"
      };

      const result = getSettingsToDisplay([layer1, layer2], assetNameMap);

      expect(result).toEqual([
        [["Image style reference", "My Style Image.jpg"]],
        [["Image style reference", "asset-id-456"]]
      ]);
    });
  });
});
