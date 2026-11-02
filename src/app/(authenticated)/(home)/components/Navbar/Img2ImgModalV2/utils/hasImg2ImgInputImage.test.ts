import { describe, expect, it } from "vitest";

import { hasImg2ImgInputImage } from "./hasImg2ImgInputImage";

describe("hasImg2ImgInputImage", () => {
  it("returns false for video mode with no resolved frame and no drawn mask", () => {
    expect(
      hasImg2ImgInputImage({
        frameType: "video",
        maskLayerDataUrl: undefined,
        maskedFrameSrc: undefined,
        inputTrackFrameSrc: undefined
      })
    ).toBe(false);
  });

  it("returns true for video mode with a resolved frame", () => {
    expect(
      hasImg2ImgInputImage({
        frameType: "video",
        maskLayerDataUrl: undefined,
        maskedFrameSrc: undefined,
        inputTrackFrameSrc: "data:image/jpeg;base64,frame"
      })
    ).toBe(true);
  });

  it("returns true for video mode with a saved drawn mask and no resolved frame", () => {
    expect(
      hasImg2ImgInputImage({
        frameType: "video",
        maskLayerDataUrl: "data:image/png;base64,layer",
        maskedFrameSrc: "data:image/jpeg;base64,frame",
        inputTrackFrameSrc: undefined
      })
    ).toBe(true);
  });

  it("returns true for upload mode with no resolved frame", () => {
    expect(
      hasImg2ImgInputImage({
        frameType: "upload",
        maskLayerDataUrl: undefined,
        maskedFrameSrc: undefined,
        inputTrackFrameSrc: undefined
      })
    ).toBe(true);
  });

  it("falls back to the frame source when only the mask layer is saved", () => {
    expect(
      hasImg2ImgInputImage({
        frameType: "video",
        maskLayerDataUrl: "data:image/png;base64,layer",
        maskedFrameSrc: undefined,
        inputTrackFrameSrc: undefined
      })
    ).toBe(false);

    expect(
      hasImg2ImgInputImage({
        frameType: "video",
        maskLayerDataUrl: "data:image/png;base64,layer",
        maskedFrameSrc: undefined,
        inputTrackFrameSrc: "data:image/jpeg;base64,frame"
      })
    ).toBe(true);
  });

  it("falls back to the frame source when only the masked frame is saved", () => {
    expect(
      hasImg2ImgInputImage({
        frameType: "video",
        maskLayerDataUrl: undefined,
        maskedFrameSrc: "data:image/jpeg;base64,frame",
        inputTrackFrameSrc: undefined
      })
    ).toBe(false);

    expect(
      hasImg2ImgInputImage({
        frameType: "video",
        maskLayerDataUrl: undefined,
        maskedFrameSrc: "data:image/jpeg;base64,frame",
        inputTrackFrameSrc: "data:image/jpeg;base64,frame"
      })
    ).toBe(true);
  });
});
