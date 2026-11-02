import { describe, expect, it } from "vitest";

import {
  buildLocalVideoSaveInputs,
  LOCAL_VIDEO_RENDER_CRF
} from "./comfyVideoSave";

describe("buildLocalVideoSaveInputs", () => {
  it("matches the Mago master H.264 CRF for local video renders", () => {
    expect(
      buildLocalVideoSaveInputs({
        filenamePrefix: "video/test",
        videoNodeId: "42"
      })
    ).toEqual({
      video: ["42", 0],
      filename_prefix: "video/test",
      format: "auto",
      "format.codec": "h264",
      "format.codec.encoding": "re-encode",
      "format.codec.encoding.crf": 20
    });
    expect(LOCAL_VIDEO_RENDER_CRF).toBe(20);
  });
});
