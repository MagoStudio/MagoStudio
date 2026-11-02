import { AssetStatus } from "@schemas/asset";
import { describe, expect, it } from "vitest";

import { isRenderCancelable } from "./isRenderCancelable";

describe("isRenderCancelable", () => {
  it("returns false when status is undefined", () => {
    expect(isRenderCancelable({ status: undefined, positionInQueue: 2 })).toBe(
      false
    );
  });

  it("returns false for the next-in-queue PENDING item", () => {
    expect(
      isRenderCancelable({
        status: AssetStatus.PENDING,
        positionInQueue: 0
      })
    ).toBe(false);
  });

  it("returns true for a PENDING item further down the queue", () => {
    expect(
      isRenderCancelable({
        status: AssetStatus.PENDING,
        positionInQueue: 2
      })
    ).toBe(true);
  });

  it("returns false for an INQUEUE item regardless of position", () => {
    expect(
      isRenderCancelable({
        status: AssetStatus.INQUEUE,
        positionInQueue: 0
      })
    ).toBe(false);
    expect(
      isRenderCancelable({
        status: AssetStatus.INQUEUE,
        positionInQueue: 4
      })
    ).toBe(false);
  });

  it("returns false for active and terminal statuses", () => {
    for (const status of [
      AssetStatus.INPROGRESS,
      AssetStatus.FINISHED,
      AssetStatus.ERROR,
      AssetStatus.CANCELLED,
      AssetStatus.PAUSED
    ]) {
      expect(isRenderCancelable({ status, positionInQueue: undefined })).toBe(
        false
      );
    }
  });
});
