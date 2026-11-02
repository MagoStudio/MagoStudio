import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIsImagePortrait } from "./useIsImagePortrait";

type LoadableImage = {
  naturalWidth: number;
  naturalHeight: number;
  onload: (() => void) | null;
  src: string;
};

const loadableImages: LoadableImage[] = [];

const loadLastImageAs = (naturalWidth: number, naturalHeight: number) => {
  const image = loadableImages.at(-1);
  if (!image) throw new Error("no Image was constructed");
  image.naturalWidth = naturalWidth;
  image.naturalHeight = naturalHeight;
  act(() => image.onload?.());
};

beforeEach(() => {
  loadableImages.length = 0;
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 0;
      naturalHeight = 0;
      onload: (() => void) | null = null;
      src = "";
      constructor() {
        loadableImages.push(this as unknown as LoadableImage);
      }
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useIsImagePortrait", () => {
  it("is undefined until the image has loaded", () => {
    const { result } = renderHook(() => useIsImagePortrait("thumbnail.jpg"));

    expect(result.current).toBeUndefined();
  });

  it("is true for an image taller than it is wide", () => {
    const { result } = renderHook(() => useIsImagePortrait("thumbnail.jpg"));

    loadLastImageAs(512, 1024);

    expect(result.current).toBe(true);
  });

  it("is false for an image wider than it is tall", () => {
    const { result } = renderHook(() => useIsImagePortrait("thumbnail.jpg"));

    loadLastImageAs(512, 288);

    expect(result.current).toBe(false);
  });

  it("is false for a square image", () => {
    const { result } = renderHook(() => useIsImagePortrait("thumbnail.jpg"));

    loadLastImageAs(512, 512);

    expect(result.current).toBe(false);
  });

  it("is undefined when there is no url to load", () => {
    const { result } = renderHook(() => useIsImagePortrait(undefined));

    expect(result.current).toBeUndefined();
    expect(loadableImages).toHaveLength(0);
  });

  it("re-measures when the url changes", () => {
    const { result, rerender } = renderHook(
      ({ imageUrl }) => useIsImagePortrait(imageUrl),
      { initialProps: { imageUrl: "landscape.jpg" as string | undefined } }
    );

    loadLastImageAs(512, 288);
    expect(result.current).toBe(false);

    rerender({ imageUrl: "portrait.jpg" });
    loadLastImageAs(512, 1024);

    expect(result.current).toBe(true);
  });

  it("ignores an image that loads after the url changed away", () => {
    const { result, rerender } = renderHook(
      ({ imageUrl }) => useIsImagePortrait(imageUrl),
      { initialProps: { imageUrl: "first.jpg" as string | undefined } }
    );

    const abandonedImage = loadableImages.at(-1)!;
    rerender({ imageUrl: "second.jpg" });

    abandonedImage.naturalWidth = 512;
    abandonedImage.naturalHeight = 1024;
    act(() => abandonedImage.onload?.());

    expect(result.current).toBeUndefined();
  });
});
