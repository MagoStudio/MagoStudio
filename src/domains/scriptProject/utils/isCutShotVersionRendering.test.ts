import { CutShotVersion } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { hasCutShotVersionRenderFailed } from "./hasCutShotVersionRenderFailed";
import { isCutShotVersionRendering } from "./isCutShotVersionRendering";

const version = (status: string, ready = false): CutShotVersion => ({
  layer_id: "layer",
  asset_id: "asset",
  name: "asset",
  ready,
  status,
  url: null,
  poster_url: null,
  upscale_of: null
});

describe("isCutShotVersionRendering", () => {
  it("is false for a ready version", () => {
    expect(isCutShotVersionRendering(version("finished", true))).toBe(false);
  });

  it("is true while the render is in progress, pending or queued", () => {
    expect(isCutShotVersionRendering(version("inprogress"))).toBe(true);
    expect(isCutShotVersionRendering(version("pending"))).toBe(true);
    expect(isCutShotVersionRendering(version("inqueue"))).toBe(true);
  });

  it("is false for an errored or cancelled render", () => {
    expect(isCutShotVersionRendering(version("error"))).toBe(false);
    expect(isCutShotVersionRendering(version("cancelled"))).toBe(false);
  });

  it("reads the status case-insensitively", () => {
    expect(isCutShotVersionRendering(version("ERROR"))).toBe(false);
  });
});

describe("hasCutShotVersionRenderFailed", () => {
  it("is true only for a not-ready version with a failed status", () => {
    expect(hasCutShotVersionRenderFailed(version("error"))).toBe(true);
    expect(hasCutShotVersionRenderFailed(version("cancelled"))).toBe(true);
    expect(hasCutShotVersionRenderFailed(version("inprogress"))).toBe(false);
    expect(hasCutShotVersionRenderFailed(version("finished", true))).toBe(
      false
    );
  });
});
