import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchFileBypassingPlaybackCache } from "./fetchFileBypassingPlaybackCache";

describe("fetchFileBypassingPlaybackCache", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks the network again instead of reusing the copy an on-page image or video cached", async () => {
    const fetchMock = vi.fn(async () => new Response("file"));
    vi.stubGlobal("fetch", fetchMock);

    await fetchFileBypassingPlaybackCache("https://cdn.example/clip.mp4");

    expect(fetchMock).toHaveBeenCalledWith("https://cdn.example/clip.mp4", {
      cache: "no-store"
    });
  });
});
