import { CutShotVersion } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isCutShotVersionAwaitingDub } from "./isCutShotVersionAwaitingDub";

const version = (overrides: Partial<CutShotVersion>): CutShotVersion => ({
  layer_id: "layer",
  asset_id: "asset",
  ready: true,
  status: "finished",
  url: null,
  poster_url: null,
  awaiting_dub: false,
  ...overrides
});

describe("isCutShotVersionAwaitingDub", () => {
  it("is true for a landed version the backend marks as awaiting its dub", () => {
    expect(isCutShotVersionAwaitingDub(version({ awaiting_dub: true }))).toBe(
      true
    );
  });

  it("is false once the dub has settled", () => {
    expect(isCutShotVersionAwaitingDub(version({}))).toBe(false);
  });

  it("is false for a failed render that still carries a stale flag", () => {
    expect(
      isCutShotVersionAwaitingDub(
        version({ ready: false, status: "error", awaiting_dub: true })
      )
    ).toBe(false);
  });
});
