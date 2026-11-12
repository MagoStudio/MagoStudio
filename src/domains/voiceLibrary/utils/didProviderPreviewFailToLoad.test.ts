import { describe, expect, it } from "vitest";

import { didProviderPreviewFailToLoad } from "./didProviderPreviewFailToLoad";

const namedError = (name: string) => Object.assign(new Error(name), { name });

describe("didProviderPreviewFailToLoad", () => {
  it("is true when the audio element recorded a media error", () => {
    expect(
      didProviderPreviewFailToLoad({
        playRejectionError: namedError("AbortError"),
        audioHasMediaError: true
      })
    ).toBe(true);
  });

  it("is true when play() rejects because the source cannot be loaded", () => {
    expect(
      didProviderPreviewFailToLoad({
        playRejectionError: namedError("NotSupportedError"),
        audioHasMediaError: false
      })
    ).toBe(true);
  });

  it("is false when the browser blocked playback, since a backend preview would be blocked too", () => {
    expect(
      didProviderPreviewFailToLoad({
        playRejectionError: namedError("NotAllowedError"),
        audioHasMediaError: false
      })
    ).toBe(false);
  });

  it("is false when a newer play request interrupted this one", () => {
    expect(
      didProviderPreviewFailToLoad({
        playRejectionError: namedError("AbortError"),
        audioHasMediaError: false
      })
    ).toBe(false);
  });
});
