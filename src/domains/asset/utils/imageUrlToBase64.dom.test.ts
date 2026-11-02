import { beforeEach, describe, expect, it, vi } from "vitest";

import { imageUrlToBase64 } from "./imageUrlToBase64";

const mockImageElement = (width: number, height: number) => {
  global.Image = class MockImage {
    width = width;
    height = height;
    crossOrigin = "";
    src = "";
    onload: (() => void) | null = null;
    onerror: ((error: unknown) => void) | null = null;

    constructor() {
      setTimeout(() => {
        this.onload?.();
      }, 0);
    }
  } as unknown as typeof Image;
};

describe("imageUrlToBase64", () => {
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toDataURL: vi.fn(() => "data:image/jpeg;base64,resizedImageData")
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string
    ) => {
      if (tagName === "canvas") return mockCanvas;
      return document.createElement(tagName);
    }) as typeof document.createElement);
  });

  it("throws on an empty imageUrl", async () => {
    await expect(imageUrlToBase64("")).rejects.toThrow("Empty imageUrl");
  });

  describe("with resizeToMaxDimension", () => {
    it("downscales a portrait image against its height", async () => {
      mockImageElement(2048, 4096);

      await imageUrlToBase64("blob:portrait-image", 1024);

      expect(mockCanvas.width).toBe(512);
      expect(mockCanvas.height).toBe(1024);
    });

    it("resizes data URLs too instead of passing them through", async () => {
      mockImageElement(4096, 4096);

      const result = await imageUrlToBase64("data:image/png;base64,abc", 1024);

      expect(result).toBe("data:image/jpeg;base64,resizedImageData");
      expect(mockCanvas.width).toBe(1024);
      expect(mockCanvas.height).toBe(1024);
    });
  });

  describe("without resizeToMaxDimension", () => {
    it("returns data URLs as-is without fetching", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      const result = await imageUrlToBase64("data:image/png;base64,original");

      expect(result).toBe("data:image/png;base64,original");
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("fetches the URL and returns the full-size base64", async () => {
      const blob = new Blob(["binary"], { type: "image/png" });
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        blob: async () => blob
      } as Response);

      global.FileReader = class MockFileReader {
        onloadend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;

        readAsDataURL() {
          setTimeout(() => {
            this.result = "data:image/png;base64,fullSizeImageData";
            this.onloadend?.();
          }, 0);
        }
      } as unknown as typeof FileReader;

      const result = await imageUrlToBase64("https://example.com/image.png");

      expect(result).toBe("data:image/png;base64,fullSizeImageData");
    });

    it("throws when the fetch fails", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        status: 404
      } as Response);

      await expect(
        imageUrlToBase64("https://example.com/missing.png")
      ).rejects.toThrow("HTTP 404 while fetching image");
    });
  });
});
