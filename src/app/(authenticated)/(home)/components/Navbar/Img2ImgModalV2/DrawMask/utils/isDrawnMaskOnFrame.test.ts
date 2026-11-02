import { describe, expect, it } from "vitest";

import { isDrawnMaskOnFrame } from "./isDrawnMaskOnFrame";

const base = {
  maskFrameIdx: 5,
  maskedFrameSrc: "data:image/jpeg;base64,frame",
  maskLayerDataUrl: "data:image/png;base64,layer",
  currentFrame: 5
};

describe("isDrawnMaskOnFrame", () => {
  it("is true when the mask frame matches and both sources exist", () => {
    expect(isDrawnMaskOnFrame(base)).toBe(true);
  });

  it("is false when the current frame differs from the mask frame", () => {
    expect(isDrawnMaskOnFrame({ ...base, currentFrame: 6 })).toBe(false);
  });

  it("is false when the masked frame source is missing", () => {
    expect(isDrawnMaskOnFrame({ ...base, maskedFrameSrc: undefined })).toBe(
      false
    );
  });

  it("is false when the mask layer is missing", () => {
    expect(isDrawnMaskOnFrame({ ...base, maskLayerDataUrl: undefined })).toBe(
      false
    );
  });

  it("is false when no mask frame is set", () => {
    expect(isDrawnMaskOnFrame({ ...base, maskFrameIdx: undefined })).toBe(
      false
    );
  });
});
