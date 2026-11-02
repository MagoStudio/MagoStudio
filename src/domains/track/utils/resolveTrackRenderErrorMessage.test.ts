import { QueueItem } from "@hooks/queue/interface";
import { describe, expect, it } from "vitest";

import { resolveTrackRenderErrorMessage } from "./resolveTrackRenderErrorMessage";

const queueItemWithError = (errorMessage: string) =>
  ({
    error: { error_type: "x.RenderError", error_message: errorMessage }
  }) as QueueItem;

describe("resolveTrackRenderErrorMessage", () => {
  it("prefers the asset's own error over the queue item's", () => {
    expect(
      resolveTrackRenderErrorMessage({
        assetError: { error: "from asset" },
        queueItem: queueItemWithError("from queue")
      })
    ).toBe("from asset");
  });

  it("falls back through asset details and message before the queue item", () => {
    expect(
      resolveTrackRenderErrorMessage({
        assetError: { details: { error: "detail", format: "f", key: "k" } },
        queueItem: undefined
      })
    ).toBe("detail");
    expect(
      resolveTrackRenderErrorMessage({
        assetError: { message: "message" },
        queueItem: undefined
      })
    ).toBe("message");
  });

  it("uses the queue item when the asset has no error", () => {
    expect(
      resolveTrackRenderErrorMessage({
        assetError: undefined,
        queueItem: queueItemWithError("from queue")
      })
    ).toBe("from queue");
  });

  it("is undefined when nothing explains the failure", () => {
    expect(
      resolveTrackRenderErrorMessage({
        assetError: undefined,
        queueItem: undefined
      })
    ).toBeUndefined();
  });
});
