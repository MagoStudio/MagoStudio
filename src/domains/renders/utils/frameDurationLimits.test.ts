import {
  FrameBasedEffectiveLimits,
  FrameBasedModelLimits,
  TimeBasedEffectiveLimits,
  TimeBasedModelLimits,
  VideoEngine
} from "@models/video/types";
import { describe, it, expect } from "vitest";

import {
  fromRangeLength,
  getEffectiveLimits,
  getMaxFrames,
  getMaxRangeLength,
  getMinFrames,
  getMinRangeLength,
  toRangeLength
} from "./frameDurationLimits";

const frameBasedLimits: FrameBasedEffectiveLimits = {
  minFrames: 8,
  maxFrames: 2000
};

const timeBasedLimits: TimeBasedEffectiveLimits = {
  minSeconds: 3,
  maxSeconds: 10
};

const frameBasedModelLimits: FrameBasedModelLimits = {
  minFrames: 8,
  maxFrames: 2000,
  interpolationMinFrames: 16,
  interpolationMaxFrames: 1000
};

const frameBasedModelLimitsNoInterpolation: FrameBasedModelLimits = {
  minFrames: 8,
  maxFrames: 2000
};

const timeBasedModelLimits: TimeBasedModelLimits = {
  minSeconds: 3,
  maxSeconds: 10
};

describe("getMinFrames", () => {
  it("should return minFrames for frame-based limits", () => {
    expect(getMinFrames(frameBasedLimits, 24)).toBe(8);
  });

  it("should convert minSeconds to frames with default +1 buffer", () => {
    expect(getMinFrames(timeBasedLimits, 24)).toBe(73);
  });

  it("should use ceiling when converting seconds to frames", () => {
    const limits: TimeBasedEffectiveLimits = {
      minSeconds: 3.1,
      maxSeconds: 10
    };
    expect(getMinFrames(limits, 24)).toBe(76);
  });

  it("should apply +3 buffer for Kling models", () => {
    expect(getMinFrames(timeBasedLimits, 24, VideoEngine.kling_o1)).toBe(75);
    expect(
      getMinFrames(timeBasedLimits, 24, VideoEngine.kling_2_6_motion_control)
    ).toBe(75);
    expect(
      getMinFrames(timeBasedLimits, 24, VideoEngine.kling_o3_edit_pro)
    ).toBe(75);
    expect(
      getMinFrames(timeBasedLimits, 24, VideoEngine.kling_3_motion_control)
    ).toBe(75);
  });

  it("should apply +3 buffer for Kling at 30fps", () => {
    expect(getMinFrames(timeBasedLimits, 30, VideoEngine.kling_o1)).toBe(93);
  });
});

describe("getMaxFrames", () => {
  it("should return maxFrames for frame-based limits", () => {
    expect(getMaxFrames(frameBasedLimits, 24)).toBe(2000);
  });

  it("should convert maxSeconds to frames for time-based limits", () => {
    expect(getMaxFrames(timeBasedLimits, 24)).toBe(240);
  });

  it("should use floor when converting seconds to frames", () => {
    const limits: TimeBasedEffectiveLimits = {
      minSeconds: 3,
      maxSeconds: 10.9
    };
    expect(getMaxFrames(limits, 24)).toBe(261);
  });
});

describe("toRangeLength", () => {
  it("should convert frames to range length (diff space)", () => {
    expect(toRangeLength(72)).toBe(71);
  });

  it("should return 0 for 1 frame", () => {
    expect(toRangeLength(1)).toBe(0);
  });

  it("should return 0 for 0 frames (edge case)", () => {
    expect(toRangeLength(0)).toBe(0);
  });
});

describe("fromRangeLength", () => {
  it("should convert range length to frames", () => {
    expect(fromRangeLength(71)).toBe(72);
  });

  it("should return 1 for 0 length", () => {
    expect(fromRangeLength(0)).toBe(1);
  });
});

describe("getMinRangeLength", () => {
  it("should return min range length for frame-based limits", () => {
    expect(getMinRangeLength(frameBasedLimits, 24)).toBe(7);
  });

  it("should return min range length for time-based limits", () => {
    expect(getMinRangeLength(timeBasedLimits, 24)).toBe(72);
  });

  it("should return min range length with Kling buffer", () => {
    expect(getMinRangeLength(timeBasedLimits, 24, VideoEngine.kling_o1)).toBe(
      74
    );
  });
});

describe("getMaxRangeLength", () => {
  it("should return max range length for frame-based limits", () => {
    expect(getMaxRangeLength(frameBasedLimits, 24)).toBe(1999);
  });

  it("should return max range length for time-based limits", () => {
    expect(getMaxRangeLength(timeBasedLimits, 24)).toBe(239);
  });
});

describe("getEffectiveLimits", () => {
  const FPS = 24;

  describe("credit mode (unlimited mode inactive)", () => {
    it("uses a source-duration override for an uncapped local model", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimits,
        false,
        false,
        undefined,
        FPS,
        5001
      );
      expect(result).toEqual({ minFrames: 8, maxFrames: 5001 });
    });

    it("should return model limits when interpolation disabled", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimits,
        false,
        false,
        undefined,
        FPS
      );
      expect(result).toEqual({ minFrames: 8, maxFrames: 2000 });
    });

    it("should return interpolation limits when interpolation enabled", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimits,
        false,
        true,
        undefined,
        FPS
      );
      expect(result).toEqual({ minFrames: 16, maxFrames: 1000 });
    });

    it("should fall back to model limits when interpolation enabled but no interpolation overrides", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimitsNoInterpolation,
        false,
        true,
        undefined,
        FPS
      );
      expect(result).toEqual({ minFrames: 8, maxFrames: 2000 });
    });
  });

  describe("relaxed mode with plan cap", () => {
    const STUDIO_MAX = 300;
    const PRO_MAX = 200;

    it("should cap maxFrames with Studio plan (300 frames)", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimits,
        true,
        false,
        STUDIO_MAX,
        FPS
      );
      expect(result).toEqual({ minFrames: 8, maxFrames: 300 });
    });

    it("should cap maxFrames with Pro plan (200 frames)", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimits,
        true,
        false,
        PRO_MAX,
        FPS
      );
      expect(result).toEqual({ minFrames: 8, maxFrames: 200 });
    });

    it("should use model max when plan limit is higher", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimits,
        true,
        false,
        5000,
        FPS
      );
      expect(result).toEqual({ minFrames: 8, maxFrames: 2000 });
    });

    it("should cap interpolation max with Studio plan in relaxed mode", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimits,
        true,
        true,
        STUDIO_MAX,
        FPS
      );
      expect(result).toEqual({ minFrames: 16, maxFrames: 300 });
    });

    it("should cap interpolation max with Pro plan in relaxed mode", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimits,
        true,
        true,
        PRO_MAX,
        FPS
      );
      expect(result).toEqual({ minFrames: 16, maxFrames: 200 });
    });

    it("should use model limits when planMaxFrameRange is undefined (fallback)", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimits,
        true,
        false,
        undefined,
        FPS
      );
      expect(result).toEqual({ minFrames: 8, maxFrames: 2000 });
    });

    it("should not apply plan cap in credit mode even if planMaxFrameRange is set", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimits,
        false,
        false,
        PRO_MAX,
        FPS
      );
      expect(result).toEqual({ minFrames: 8, maxFrames: 2000 });
    });
  });

  describe("relaxed mode with plan cap - model without interpolation", () => {
    it("should cap model without interpolation overrides with Studio plan", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimitsNoInterpolation,
        true,
        false,
        300,
        FPS
      );
      expect(result).toEqual({ minFrames: 8, maxFrames: 300 });
    });

    it("should cap model without interpolation overrides with Pro plan", () => {
      const result = getEffectiveLimits(
        frameBasedModelLimitsNoInterpolation,
        true,
        false,
        200,
        FPS
      );
      expect(result).toEqual({ minFrames: 8, maxFrames: 200 });
    });
  });

  describe("time-based limits", () => {
    it("should return time-based limits in credit mode", () => {
      const result = getEffectiveLimits(
        timeBasedModelLimits,
        false,
        false,
        undefined,
        FPS
      );
      expect(result).toEqual({ minSeconds: 3, maxSeconds: 10 });
    });

    it("should cap with Studio plan (300 frames at 24fps = 12.5s, model max 10s -> 10s wins)", () => {
      const result = getEffectiveLimits(
        timeBasedModelLimits,
        true,
        false,
        300,
        FPS
      );
      expect(result).toEqual({ minSeconds: 3, maxSeconds: 10 });
    });

    it("should cap with Pro plan (200 frames at 24fps = 8.33s, model max 10s -> plan wins)", () => {
      const result = getEffectiveLimits(
        timeBasedModelLimits,
        true,
        false,
        200,
        FPS
      );
      expect(result.minSeconds).toBe(3);
      expect(result.maxSeconds).toBeCloseTo(8.333, 2);
    });

    it("should cap with planMaxFrameRange converted to seconds", () => {
      const result = getEffectiveLimits(
        timeBasedModelLimits,
        true,
        false,
        120,
        FPS
      );
      expect(result).toEqual({ minSeconds: 3, maxSeconds: 5 });
    });

    it("should use model maxSeconds when plan cap in seconds is higher", () => {
      const result = getEffectiveLimits(
        timeBasedModelLimits,
        true,
        false,
        720,
        FPS
      );
      expect(result).toEqual({ minSeconds: 3, maxSeconds: 10 });
    });

    it("should not apply plan cap to time-based model in credit mode", () => {
      const result = getEffectiveLimits(
        timeBasedModelLimits,
        false,
        false,
        200,
        FPS
      );
      expect(result).toEqual({ minSeconds: 3, maxSeconds: 10 });
    });
  });

  describe("time-based limits with 30s model (Kling motion control)", () => {
    const kling30sModel: TimeBasedModelLimits = {
      minSeconds: 3,
      maxSeconds: 30
    };

    it("should cap with Studio plan (300 frames at 24fps = 12.5s, model max 30s -> plan wins)", () => {
      const result = getEffectiveLimits(kling30sModel, true, false, 300, FPS);
      expect(result).toEqual({ minSeconds: 3, maxSeconds: 12.5 });
    });

    it("should cap with Pro plan (200 frames at 24fps = 8.33s, model max 30s -> plan wins)", () => {
      const result = getEffectiveLimits(kling30sModel, true, false, 200, FPS);
      expect(result.minSeconds).toBe(3);
      expect(result.maxSeconds).toBeCloseTo(8.333, 2);
    });

    it("should use model max in credit mode", () => {
      const result = getEffectiveLimits(
        kling30sModel,
        false,
        false,
        undefined,
        FPS
      );
      expect(result).toEqual({ minSeconds: 3, maxSeconds: 30 });
    });
  });
});

describe("integration: complete flow", () => {
  it("should correctly compute range lengths for time-based model", () => {
    const limits = getEffectiveLimits(
      timeBasedModelLimits,
      false,
      false,
      undefined,
      24
    );
    const minFrames = getMinFrames(limits, 24);
    const maxFrames = getMaxFrames(limits, 24);

    expect(minFrames).toBe(73);
    expect(maxFrames).toBe(240);
    expect(toRangeLength(minFrames)).toBe(72);
    expect(toRangeLength(maxFrames)).toBe(239);
  });

  it("should correctly compute range lengths for Kling model at 30fps", () => {
    const limits = getEffectiveLimits(
      timeBasedModelLimits,
      false,
      false,
      undefined,
      30
    );
    const minFrames = getMinFrames(limits, 30, VideoEngine.kling_o1);
    const maxFrames = getMaxFrames(limits, 30);

    expect(minFrames).toBe(93);
    expect(maxFrames).toBe(300);
    expect(toRangeLength(minFrames)).toBe(92);
    expect(toRangeLength(maxFrames)).toBe(299);
  });

  it("should correctly compute range lengths for frame-based model", () => {
    const limits = getEffectiveLimits(
      frameBasedModelLimits,
      false,
      false,
      undefined,
      24
    );
    const minFrames = getMinFrames(limits, 24);
    const maxFrames = getMaxFrames(limits, 24);

    expect(minFrames).toBe(8);
    expect(maxFrames).toBe(2000);
    expect(toRangeLength(minFrames)).toBe(7);
    expect(toRangeLength(maxFrames)).toBe(1999);
  });

  it("should correctly apply Studio plan cap (300) in relaxed mode", () => {
    const limits = getEffectiveLimits(
      frameBasedModelLimits,
      true,
      false,
      300,
      24
    );
    const minFrames = getMinFrames(limits, 24);
    const maxFrames = getMaxFrames(limits, 24);

    expect(minFrames).toBe(8);
    expect(maxFrames).toBe(300);
    expect(toRangeLength(maxFrames)).toBe(299);
  });

  it("should correctly apply Pro plan cap (200) in relaxed mode", () => {
    const limits = getEffectiveLimits(
      frameBasedModelLimits,
      true,
      false,
      200,
      24
    );
    const minFrames = getMinFrames(limits, 24);
    const maxFrames = getMaxFrames(limits, 24);

    expect(minFrames).toBe(8);
    expect(maxFrames).toBe(200);
    expect(toRangeLength(maxFrames)).toBe(199);
  });

  it("should correctly apply Studio plan cap to Kling time-based model at 24fps", () => {
    const kling30sModel: TimeBasedModelLimits = {
      minSeconds: 3,
      maxSeconds: 30
    };
    const limits = getEffectiveLimits(kling30sModel, true, false, 300, 24);
    const minFrames = getMinFrames(limits, 24, VideoEngine.kling_o1);
    const maxFrames = getMaxFrames(limits, 24);

    expect(minFrames).toBe(75);
    expect(maxFrames).toBe(300);
  });

  it("should correctly apply Pro plan cap to Kling time-based model at 24fps", () => {
    const kling30sModel: TimeBasedModelLimits = {
      minSeconds: 3,
      maxSeconds: 30
    };
    const limits = getEffectiveLimits(kling30sModel, true, false, 200, 24);
    const minFrames = getMinFrames(limits, 24, VideoEngine.kling_o1);
    const maxFrames = getMaxFrames(limits, 24);

    expect(minFrames).toBe(75);
    expect(maxFrames).toBe(200);
  });
});
