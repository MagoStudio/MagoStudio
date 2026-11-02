import { describe, expect, it } from "vitest";

import {
  buildPreparedVideoFilter,
  buildVideoThumbnailArgs,
  buildWanPreparedVideoFilter
} from "./imageRenderService";

describe("buildPreparedVideoFilter", () => {
  it("caps the video at 1280 on the long side while preserving aspect ratio", () => {
    const filter = buildPreparedVideoFilter(24);

    expect(filter).toContain("fps=24");
    expect(filter).toContain(
      "scale=1280:1280:force_original_aspect_ratio=decrease"
    );
    expect(filter).not.toContain("crop=");
    expect(filter).not.toContain("pad=");
  });

  it("omits the fps filter when no target fps is given", () => {
    expect(buildPreparedVideoFilter()).not.toContain("fps=");
  });

  it("crops to the input crop before scaling, so the provider only sees the crop", () => {
    const filter = buildPreparedVideoFilter(24, {
      x: 64,
      y: 32,
      w: 128,
      h: 256
    });

    expect(filter).toBe(
      "fps=24,crop=128:256:64:32," +
        "scale=1280:1280:force_original_aspect_ratio=decrease," +
        "scale=trunc(iw/2)*2:trunc(ih/2)*2"
    );
    expect(filter.indexOf("crop=")).toBeLessThan(filter.indexOf("scale="));
  });
});

describe("buildWanPreparedVideoFilter", () => {
  it("fits the source within the target size without cropping, then pads up to a multiple of 16, anchored top-left", () => {
    const filter = buildWanPreparedVideoFilter(24, 640, 360);

    expect(filter).toContain("fps=24");
    expect(filter).toContain(
      "scale=640:360:force_original_aspect_ratio=decrease"
    );
    expect(filter).toContain("pad=640:368:0:0:color=black");
    expect(filter).not.toContain("crop=");
  });

  it("mixes Fun Control raw video RGB toward exact 127 gray when a control strength is given", () => {
    const filter = buildWanPreparedVideoFilter(24, 640, 640, 0.35);

    expect(filter).toContain("pad=640:640:0:0:color=black");
    expect(filter).toContain("r=127+(val-127)*0.35");
    expect(filter).toContain("g=127+(val-127)*0.35");
    expect(filter).toContain("b=127+(val-127)*0.35");
  });

  it("crops to the input crop before fitting and padding to the Wan target", () => {
    const filter = buildWanPreparedVideoFilter(24, 640, 360, undefined, {
      x: 100,
      y: 0,
      w: 1280,
      h: 704
    });

    expect(filter).toBe(
      "fps=24,crop=1280:704:100:0," +
        "scale=640:360:force_original_aspect_ratio=decrease," +
        "pad=640:368:0:0:color=black"
    );
    expect(filter.indexOf("crop=")).toBeLessThan(filter.indexOf("scale="));
  });

  it("keeps the Fun Control gray mix after the crop and pad", () => {
    const filter = buildWanPreparedVideoFilter(24, 640, 640, 0.5, {
      x: 0,
      y: 0,
      w: 512,
      h: 512
    });

    expect(filter).toContain("crop=512:512:0:0");
    expect(filter.indexOf("crop=")).toBeLessThan(filter.indexOf("lutrgb"));
  });

  it("pads LTX x4 content to its 128-pixel processing grid", () => {
    const filter = buildWanPreparedVideoFilter(
      24,
      3328,
      1856,
      undefined,
      undefined,
      128
    );

    expect(filter).toContain(
      "scale=3328:1856:force_original_aspect_ratio=decrease"
    );
    expect(filter).toContain("pad=3328:1920:0:0:color=black");
  });

  it("clamps motion strength to the documented 0-1 range", () => {
    expect(buildWanPreparedVideoFilter(30, 640, 640, -2)).toContain(
      "(val-127)*0"
    );
    expect(buildWanPreparedVideoFilter(30, 640, 640, 2)).toContain(
      "(val-127)*1"
    );
  });
});

describe("buildVideoThumbnailArgs", () => {
  it("extracts exactly the first frame as a scaled JPEG", () => {
    const args = buildVideoThumbnailArgs("render.mp4", "thumbnail.jpg");

    expect(args.slice(args.indexOf("-ss"), args.indexOf("-ss") + 2)).toEqual([
      "-ss",
      "0"
    ]);
    expect(
      args.slice(args.indexOf("-frames:v"), args.indexOf("-frames:v") + 2)
    ).toEqual(["-frames:v", "1"]);
    expect(args).toContain("scale=480:-2:force_original_aspect_ratio=decrease");
    expect(args.at(-1)).toBe("thumbnail.jpg");
  });
});
