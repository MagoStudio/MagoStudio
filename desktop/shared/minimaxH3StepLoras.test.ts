import { describe, expect, it } from "vitest";

import {
  resolveMiniMaxH3QualitySteps,
  resolveMiniMaxH3StepLoraSteps
} from "./minimaxH3StepLoras";

describe("resolveMiniMaxH3StepLoraSteps", () => {
  it.each([
    [2, 2],
    [3, 2],
    [4, 4],
    [8, 8],
    [undefined, 8],
    ["four", 8],
    [16, 8]
  ])("resolves %s to %i steps", (value, expectedSteps) => {
    expect(resolveMiniMaxH3StepLoraSteps(value)).toBe(expectedSteps);
  });
});

describe("resolveMiniMaxH3QualitySteps", () => {
  it.each([
    ["draft", 2],
    ["turbo", 4],
    ["medium", 4],
    ["hd", 8],
    ["high", 8],
    [undefined, 8]
  ])("resolves %s quality to %i steps", (quality, expectedSteps) => {
    expect(resolveMiniMaxH3QualitySteps(quality)).toBe(expectedSteps);
  });
});
