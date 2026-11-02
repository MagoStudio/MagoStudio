import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isComfyManagerAvailable,
  rebootThroughComfyManager
} from "./comfyManagerReboot";

describe("ComfyUI-Manager reboot", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("falls back to the older route when the newer one is missing", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith("/manager/reboot") && !url.includes("/api/")
        ? new Response("ok")
        : new Response("missing", { status: 404 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      rebootThroughComfyManager("http://127.0.0.1:8188")
    ).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8188/api/manager/reboot",
      expect.anything()
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8188/manager/reboot",
      expect.anything()
    );
  });

  it("reports no Manager when neither route answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("missing", { status: 404 }))
    );

    await expect(
      isComfyManagerAvailable("http://127.0.0.1:8188")
    ).resolves.toBe(false);
  });
});
