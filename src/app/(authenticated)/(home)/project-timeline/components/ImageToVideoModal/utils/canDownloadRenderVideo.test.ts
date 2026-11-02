import { AssetStatus } from "@schemas/asset";
import { describe, expect, it } from "vitest";

import { canDownloadRenderVideo } from "./canDownloadRenderVideo";

describe("canDownloadRenderVideo", () => {
  it("allows downloading a finished render that produced an output asset", () => {
    expect(
      canDownloadRenderVideo({
        status: AssetStatus.FINISHED,
        hasOutputAsset: true
      })
    ).toBe(true);
  });

  it("refuses a finished render with no output asset", () => {
    expect(
      canDownloadRenderVideo({
        status: AssetStatus.FINISHED,
        hasOutputAsset: false
      })
    ).toBe(false);
  });

  it("refuses a render that is still processing", () => {
    expect(
      canDownloadRenderVideo({
        status: AssetStatus.INPROGRESS,
        hasOutputAsset: true
      })
    ).toBe(false);
  });

  it("refuses a render with no resolved status", () => {
    expect(
      canDownloadRenderVideo({ status: undefined, hasOutputAsset: true })
    ).toBe(false);
  });
});
