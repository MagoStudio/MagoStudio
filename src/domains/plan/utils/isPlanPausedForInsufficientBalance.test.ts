import { describe, expect, it } from "vitest";

import { isPlanPausedForInsufficientBalance } from "./isPlanPausedForInsufficientBalance";

describe("isPlanPausedForInsufficientBalance", () => {
  it("is true for a plan the backend paused because credits ran out", () => {
    expect(
      isPlanPausedForInsufficientBalance({
        status: "PAUSED",
        error: { message: "Insufficient balance" }
      })
    ).toBe(true);
  });

  it("is false for a plan paused to await image review", () => {
    expect(
      isPlanPausedForInsufficientBalance({
        status: "PAUSED",
        error: { message: "Paused after img2img — awaiting review" }
      })
    ).toBe(false);
  });

  it("is false for a running plan, even with a stale balance error", () => {
    expect(
      isPlanPausedForInsufficientBalance({
        status: "RUNNING",
        error: { message: "Insufficient balance" }
      })
    ).toBe(false);
  });

  it("is false before any progress has loaded", () => {
    expect(isPlanPausedForInsufficientBalance(undefined)).toBe(false);
  });

  it("is true when the backend marks the pause with its insufficient_balance reason, whatever the message says", () => {
    expect(
      isPlanPausedForInsufficientBalance({
        status: "PAUSED",
        error: { message: "Out of credits", reason: "insufficient_balance" }
      })
    ).toBe(true);
  });

  it("is false for the image review pause, which carries its own reason", () => {
    expect(
      isPlanPausedForInsufficientBalance({
        status: "PAUSED",
        error: {
          message: "Paused after img2img — awaiting review",
          reason: "awaiting_img2img_review"
        }
      })
    ).toBe(false);
  });
});
