import { seedance2I2vFastModel } from "@models/video/seedance2I2vFastModel";
import { seedance2I2vModel } from "@models/video/seedance2I2vModel";
import { describe, expect, test } from "vitest";

import { resolveResolutionForEngine } from "./resolveResolutionForEngine";

describe("resolveResolutionForEngine", () => {
  test("resets to the model's default resolution when switching from an unsupported standard resolution", () => {
    expect(resolveResolutionForEngine("1080p", seedance2I2vFastModel)).toBe(
      "720p"
    );
    expect(resolveResolutionForEngine("4k", seedance2I2vFastModel)).toBe(
      "720p"
    );
  });

  test("keeps the resolution unchanged when switching from standard to fast with an already-supported resolution", () => {
    expect(resolveResolutionForEngine("720p", seedance2I2vFastModel)).toBe(
      "720p"
    );
    expect(resolveResolutionForEngine("480p", seedance2I2vFastModel)).toBe(
      "480p"
    );
  });

  test("keeps the resolution unchanged when switching from fast to standard", () => {
    expect(resolveResolutionForEngine("480p", seedance2I2vModel)).toBe("480p");
    expect(resolveResolutionForEngine("720p", seedance2I2vModel)).toBe("720p");
  });

  test("falls back to the model's default resolution when no current resolution is set", () => {
    expect(resolveResolutionForEngine(undefined, seedance2I2vFastModel)).toBe(
      "720p"
    );
    expect(resolveResolutionForEngine(undefined, seedance2I2vModel)).toBe(
      "720p"
    );
  });

  test("never falls back to the most expensive resolution", () => {
    expect(resolveResolutionForEngine(undefined, seedance2I2vModel)).not.toBe(
      "4k"
    );
    expect(
      resolveResolutionForEngine("unsupported", seedance2I2vModel)
    ).not.toBe("4k");
  });
});
