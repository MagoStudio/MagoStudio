import { VideoEngine } from "@models/video/types";
import { LayerType } from "@schemas/layer";
import { describe, expect, test } from "vitest";

import { getQueueItemTool } from "./getQueueItemTool";

describe("getQueueItemTool", () => {
  test("opens explicit image jobs in Edit Image", () => {
    expect(
      getQueueItemTool({
        kind: "image",
        trackType: undefined,
        engine: undefined
      })
    ).toBe("edit-frame");
  });

  test("opens IMG2IMG tracks in Edit Image for legacy queue items", () => {
    expect(
      getQueueItemTool({
        kind: undefined,
        trackType: LayerType.IMG2IMG,
        engine: undefined
      })
    ).toBe("edit-frame");
  });

  test("keeps video jobs in their engine tool", () => {
    expect(
      getQueueItemTool({
        kind: "video",
        trackType: LayerType.RENDER,
        engine: VideoEngine.seedance_2
      })
    ).toBe("render-video");
  });
});
