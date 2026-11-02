import { ltx23SpatialUpscalerModel } from "@models/video/ltx23SpatialUpscalerModel";
import { magoAnimateModel } from "@models/video/magoAnimateModel";
import { magoStyleTransferLocalModel } from "@models/video/magoStyleTransferLocalModel";
import { magoV2_5_0RenderModel } from "@models/video/magoV2_5_0VideoModel";
import { magoV3_1_0RenderModel } from "@models/video/magoV3_1_0VideoModel";
import { magoV3_2_0RenderModel } from "@models/video/magoV3_2_0VideoModel";
import { magoV3_3_0RenderModel } from "@models/video/magoV3_3_0VideoModel";
import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { wanAnimate22Model } from "@models/video/wanAnimate22Model";
import { wanVace21Model } from "@models/video/wanVace21Model";
import { describe, test, expect } from "vitest";

import { validateRange } from "./validateRange";

describe("validateRange", () => {
  const testCases: Array<{
    current: {
      min: number;
      max: number;
    };
    newValue: {
      min?: number;
      max?: number;
    };
    videoLength: number;
    isUnlimitedModeActive: boolean;
    isInterpolationEnabled: boolean;
    magoEngine?: VideoEngine;
    expected: {
      min: number;
      max: number;
    };
  }> = [
    {
      current: {
        min: 0,
        max: 10
      },
      newValue: {
        max: 5
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 7
      }
    },

    {
      current: {
        min: 0,
        max: 10
      },
      newValue: {
        min: 5
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 5,
        max: 12
      }
    },

    {
      current: {
        min: 0,
        max: 10
      },
      newValue: {
        min: 20
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 13,
        max: 20
      }
    },

    {
      current: {
        min: 0,
        max: 10
      },
      newValue: {
        min: 11
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 11,
        max: 20
      }
    },

    {
      current: {
        min: 10,
        max: 20
      },
      newValue: {
        max: 1
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 7
      }
    },

    {
      current: {
        min: 10,
        max: 20
      },
      newValue: {
        max: 9
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 9
      }
    },

    {
      current: {
        min: 10,
        max: 20
      },
      newValue: {
        min: 15
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 13,
        max: 20
      }
    },

    {
      current: {
        min: 10,
        max: 20
      },
      newValue: {
        min: 30
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 13,
        max: 20
      }
    },

    {
      current: {
        min: 10,
        max: 20
      },
      newValue: {
        max: 30
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 10,
        max: 20
      }
    },

    {
      current: {
        min: 10,
        max: 20
      },
      newValue: {
        min: -1
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 20
      }
    },

    {
      current: {
        min: 10,
        max: 20
      },
      newValue: {
        max: -1
      },
      videoLength: 20,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 7
      }
    },

    {
      current: {
        min: 100,
        max: 200
      },
      newValue: {
        min: 0
      },
      videoLength: 599,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 200
      }
    },

    {
      current: {
        min: 100,
        max: 200
      },
      newValue: {
        max: 300
      },
      videoLength: 599,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 100,
        max: 300
      }
    },

    {
      current: {
        min: 100,
        max: 200
      },
      newValue: {
        max: 0
      },
      videoLength: 599,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 7
      }
    },

    {
      current: {
        min: 100,
        max: 200
      },
      newValue: {
        min: 599
      },
      videoLength: 599,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 592,
        max: 599
      }
    },

    {
      current: {
        min: 100,
        max: 200
      },
      newValue: {
        min: 400
      },
      videoLength: 599,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 400,
        max: 500
      }
    },

    {
      current: {
        min: 300,
        max: 400
      },
      newValue: {
        min: 1
      },
      videoLength: 599,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 1,
        max: 400
      }
    },

    {
      current: {
        min: 300,
        max: 500
      },
      newValue: {
        min: 50
      },
      videoLength: 599,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 50,
        max: 500
      }
    },

    {
      current: {
        min: 50,
        max: 60
      },
      newValue: {
        min: 300
      },
      videoLength: 599,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 300,
        max: 310
      }
    },

    {
      current: {
        min: 50,
        max: 60
      },
      newValue: {
        max: 500
      },
      videoLength: 599,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 50,
        max: 500
      }
    },

    {
      current: {
        min: 0,
        max: 10
      },
      newValue: {
        max: 10000
      },
      videoLength: 200,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 190,
        max: 200
      }
    },

    {
      current: {
        min: 6,
        max: 13
      },
      newValue: {
        max: 12
      },
      videoLength: 200,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 5,
        max: 12
      }
    },

    {
      current: {
        min: 0,
        max: 1000
      },
      newValue: {
        max: 3000
      },
      videoLength: 5000,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 1001,
        max: 3000
      }
    },

    {
      current: {
        min: 100,
        max: 200
      },
      newValue: {
        min: 0
      },
      videoLength: 3000,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 200
      }
    },

    {
      current: {
        min: 1000,
        max: 1100
      },
      newValue: {
        min: 0
      },
      videoLength: 5000,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 1100
      }
    },

    {
      current: {
        min: 3000,
        max: 3100
      },
      newValue: {
        min: 0
      },
      videoLength: 5000,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 1999
      }
    },

    {
      current: {
        min: 0,
        max: 50
      },
      newValue: {
        max: 200
      },
      videoLength: 300,
      isUnlimitedModeActive: true,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 200
      }
    },

    {
      current: {
        min: 50,
        max: 100
      },
      newValue: {
        min: 0
      },
      videoLength: 300,
      isUnlimitedModeActive: true,
      isInterpolationEnabled: false,
      expected: {
        min: 0,
        max: 100
      }
    },

    {
      current: {
        min: 0,
        max: 20
      },
      newValue: {
        max: 10
      },
      videoLength: 100,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: true,
      magoEngine: VideoEngine.V2_5_0,
      expected: {
        min: 0,
        max: 14
      }
    },

    {
      current: {
        min: 0,
        max: 30
      },
      newValue: {
        max: 20
      },
      videoLength: 100,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: true,
      magoEngine: VideoEngine.V3_2_0,
      expected: {
        min: 0,
        max: 23
      }
    },

    {
      current: {
        min: 10,
        max: 40
      },
      newValue: {
        min: 30
      },
      videoLength: 100,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: true,
      magoEngine: VideoEngine.V3_1_0,
      expected: {
        min: 30,
        max: 53
      }
    },

    {
      current: {
        min: 0,
        max: 50
      },
      newValue: {
        min: 40
      },
      videoLength: 100,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: true,
      magoEngine: VideoEngine.V3_3_0,
      expected: {
        min: 40,
        max: 63
      }
    },

    {
      current: {
        min: 5,
        max: 25
      },
      newValue: {
        max: 12
      },
      videoLength: 100,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: true,
      expected: {
        min: 0,
        max: 14
      }
    },

    {
      current: {
        min: 50,
        max: 74
      },
      newValue: {
        min: 80
      },
      videoLength: 100,
      isUnlimitedModeActive: false,
      isInterpolationEnabled: true,
      magoEngine: VideoEngine.V3_2_0,
      expected: {
        min: 77,
        max: 100
      }
    }
  ];

  describe("graceful fallback for unhandled edge cases", () => {
    const baseParams = {
      currentMin: 10,
      currentMax: 50,
      shotMaxFrames: 100,
      isInterpolationEnabled: false,
      selectedModel: magoV2_5_0RenderModel,
      planMaxFrameRange: undefined,
      isRelaxedEnabled: false,
      fps: 30
    };

    test("does not throw when newMin is NaN — returns current range unchanged", () => {
      expect(() =>
        validateRange({ ...baseParams, newValue: NaN, isNewValueMin: true })
      ).not.toThrow();

      const result = validateRange({
        ...baseParams,
        newValue: NaN,
        isNewValueMin: true
      });
      expect(result.newMin).toBe(10);
      expect(result.newMax).toBe(50);
    });

    test("does not throw when newMax is NaN — returns current range unchanged", () => {
      expect(() =>
        validateRange({ ...baseParams, newValue: NaN, isNewValueMin: false })
      ).not.toThrow();

      const result = validateRange({
        ...baseParams,
        newValue: NaN,
        isNewValueMin: false
      });
      expect(result.newMin).toBe(10);
      expect(result.newMax).toBe(50);
    });
  });

  test.each([
    wanAnimate22Model,
    wanVace21Model,
    magoStyleTransferLocalModel,
    magoAnimateModel,
    ltx23SpatialUpscalerModel
  ])("allows the local model $name past its metadata maximum", (model) => {
    expect(
      validateRange({
        currentMin: 0,
        currentMax: 2000,
        newValue: 4000,
        isNewValueMin: false,
        shotMaxFrames: 5000,
        isInterpolationEnabled: false,
        selectedModel: model,
        planMaxFrameRange: undefined,
        isRelaxedEnabled: false,
        fps: 30
      })
    ).toEqual({ newMin: 0, newMax: 4000 });
  });

  testCases.forEach((testCase, index) => {
    const isMin = "min" in testCase.newValue;
    const action = isMin ? "min" : "max";
    const value = isMin ? testCase.newValue.min : testCase.newValue.max;
    const description = `Test ${index + 1}: User can modify frame range from ${testCase.current.min}-${testCase.current.max} by changing ${action} to ${value} expect ${testCase.expected.min}-${testCase.expected.max} while video length is ${testCase.videoLength}`;

    test(description, () => {
      let selectedModel: VideoModelDefinition;
      switch (testCase.magoEngine) {
        case VideoEngine.V3_3_0:
          selectedModel = magoV3_3_0RenderModel;
          break;
        case VideoEngine.V3_2_0:
          selectedModel = magoV3_2_0RenderModel;
          break;
        case VideoEngine.V3_1_0:
          selectedModel = magoV3_1_0RenderModel;
          break;
        case VideoEngine.V2_5_0:
        default:
          selectedModel = magoV2_5_0RenderModel;
          break;
      }

      const result = validateRange({
        currentMin: testCase.current.min,
        currentMax: testCase.current.max,
        newValue: value as number,
        isNewValueMin: isMin,
        shotMaxFrames: testCase.videoLength,
        isInterpolationEnabled: testCase.isInterpolationEnabled,
        selectedModel,
        planMaxFrameRange: testCase.isUnlimitedModeActive ? 300 : undefined,
        isRelaxedEnabled: testCase.isUnlimitedModeActive,
        fps: 30
      });

      expect(result.newMin).toBe(testCase.expected.min);
      expect(result.newMax).toBe(testCase.expected.max);
    });
  });
});
