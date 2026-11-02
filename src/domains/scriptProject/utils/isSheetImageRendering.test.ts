import { SheetImage } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isSheetImageRendering } from "./isSheetImageRendering";

const buildSheetImage = (status: string): SheetImage =>
  ({ asset_id: "asset-1", status }) as SheetImage;

describe("isSheetImageRendering", () => {
  it("reports a pending image as still rendering", () => {
    expect(isSheetImageRendering(buildSheetImage("pending"))).toBe(true);
  });

  it("reports an in-progress image as still rendering", () => {
    expect(isSheetImageRendering(buildSheetImage("inprogress"))).toBe(true);
  });

  it.each([
    "success",
    "available",
    "failed",
    "cancelled",
    "timeout",
    "error",
    "not_found"
  ])("reports a %s image as finished", (status) => {
    expect(isSheetImageRendering(buildSheetImage(status))).toBe(false);
  });

  it("matches a terminal status regardless of case", () => {
    expect(isSheetImageRendering(buildSheetImage("FAILED"))).toBe(false);
  });
});
