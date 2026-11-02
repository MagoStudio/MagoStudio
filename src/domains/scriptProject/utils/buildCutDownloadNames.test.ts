import { CutShot } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildCutDownloadName } from "./buildCutDownloadNames";

const cutShot = (overrides: Partial<CutShot>): CutShot => ({
  timeline_id: "timeline-1",
  shot_index: 0,
  sequence_id: 1,
  heading: null,
  asset_id: "asset-1",
  pinned_asset_id: null,
  version_name: null,
  is_upscale: false,
  url: null,
  poster_url: null,
  versions: [],
  ...overrides
});

describe("buildCutDownloadName", () => {
  it("preserves numbering already in the title without a position prefix", () => {
    expect(
      buildCutDownloadName(
        cutShot({ shot_index: 4, heading: "1.1 Entering the house" })
      )
    ).toBe("1.1_Entering_the_house.mp4");
  });

  it("orders an unnumbered title by shot position so a file manager sorts the cut", () => {
    expect(
      buildCutDownloadName(
        cutShot({ shot_index: 0, heading: "EXT. RUINED COLONY" })
      )
    ).toBe("01_EXT._RUINED_COLONY.mp4");
  });

  it("pads the position to two digits", () => {
    expect(buildCutDownloadName(cutShot({ shot_index: 11 }))).toMatch(/^12_/);
  });

  it("falls back to the version name when there is no heading", () => {
    expect(
      buildCutDownloadName(cutShot({ heading: null, version_name: "shot2_v1" }))
    ).toBe("01_shot2_v1.mp4");
  });

  it("falls back to the sequence id when there is neither", () => {
    expect(buildCutDownloadName(cutShot({ sequence_id: 7 }))).toBe(
      "01_shot_7.mp4"
    );
  });

  it("strips characters a filesystem would reject", () => {
    expect(
      buildCutDownloadName(cutShot({ heading: "INT. KID'S ROOM / NIGHT" }))
    ).toBe("01_INT._KID_S_ROOM_NIGHT.mp4");
  });

  it("never leaves leading, trailing or repeated dots", () => {
    expect(buildCutDownloadName(cutShot({ heading: "INT. ROOM." }))).toBe(
      "01_INT._ROOM.mp4"
    );
    expect(buildCutDownloadName(cutShot({ heading: "...Later" }))).toBe(
      "01_Later.mp4"
    );
    expect(
      buildCutDownloadName(cutShot({ heading: ".", sequence_id: 3 }))
    ).toBe("01_shot_3.mp4");
  });
});
