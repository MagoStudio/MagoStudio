import { describe, expect, it } from "vitest";

import { snapNumberToStep } from "./snapNumberToStep";

describe("snapNumberToStep", () => {
  it("snaps a fractional key-frame count to a whole number", () => {
    expect(snapNumberToStep({ value: 2.5, min: 1, step: 1 })).toBe(3);
  });

  it("leaves a value that already sits on a step untouched", () => {
    expect(snapNumberToStep({ value: 3, min: 1, step: 1 })).toBe(3);
  });

  it("snaps chunk seconds to the nearest half second", () => {
    expect(snapNumberToStep({ value: 2.3, min: 0.5, step: 0.5 })).toBe(2.5);
  });

  it("keeps half-second results free of floating point noise", () => {
    expect(snapNumberToStep({ value: 7.1, min: 0.5, step: 0.5 })).toBe(7);
  });
});
