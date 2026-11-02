import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  resizeImageFromUrl,
  resizeImageFromFile,
  getImageDimensions
} from "./resizeImage";

describe("resizeImage utilities", () => {
  let mockImage: HTMLImageElement;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    mockContext = {
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D;

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toDataURL: vi.fn(() => "data:image/jpeg;base64,mockedImageData"),
      toBlob: vi.fn((callback) => {
        const blob = new Blob(["mock"], { type: "image/jpeg" });
        callback(blob);
      })
    } as unknown as HTMLCanvasElement;

    mockImage = {
      width: 1920,
      height: 1080,
      crossOrigin: "",
      src: "",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as unknown as HTMLImageElement;

    vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string
    ) => {
      if (tagName === "canvas") {
        return mockCanvas;
      }
      return document.createElement(tagName);
    }) as typeof document.createElement);

    global.Image = class MockImage {
      width = 1920;
      height = 1080;
      crossOrigin = "";
      src = "";
      onload: (() => void) | null = null;
      onerror: ((error: any) => void) | null = null;

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as any;
  });

  describe("resizeImageFromUrl", () => {
    it("should resize image from URL to specified max width", async () => {
      const imageUrl = "https://example.com/image.jpg";
      const maxWidth = 800;

      const result = await resizeImageFromUrl(imageUrl, { maxWidth });

      expect(result).toBe("data:image/jpeg;base64,mockedImageData");
      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(450);
      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it("should resize image to fit both max width and height", async () => {
      const imageUrl = "https://example.com/image.jpg";
      const maxWidth = 800;
      const maxHeight = 600;

      await resizeImageFromUrl(imageUrl, { maxWidth, maxHeight });

      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(450);
    });

    it("should not resize if image is already smaller than max dimensions", async () => {
      global.Image = class MockImage {
        width = 640;
        height = 480;
        crossOrigin = "";
        src = "";
        onload: (() => void) | null = null;
        onerror: ((error: any) => void) | null = null;

        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      } as any;

      const imageUrl = "https://example.com/small-image.jpg";
      await resizeImageFromUrl(imageUrl, { maxWidth: 800 });

      expect(mockCanvas.width).toBe(640);
      expect(mockCanvas.height).toBe(480);
    });

    it("should handle portrait images correctly", async () => {
      global.Image = class MockImage {
        width = 1080;
        height = 1920;
        crossOrigin = "";
        src = "";
        onload: (() => void) | null = null;
        onerror: ((error: any) => void) | null = null;

        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      } as any;

      const imageUrl = "https://example.com/portrait.jpg";
      await resizeImageFromUrl(imageUrl, { maxHeight: 800 });

      expect(mockCanvas.width).toBe(450);
      expect(mockCanvas.height).toBe(800);
    });

    it("should reject when image fails to load", async () => {
      global.Image = class MockImage {
        width = 1920;
        height = 1080;
        crossOrigin = "";
        src = "";
        onload: (() => void) | null = null;
        onerror: ((error: any) => void) | null = null;

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error("Failed to load"));
            }
          }, 0);
        }
      } as any;

      const imageUrl = "https://example.com/invalid-image.jpg";

      await expect(
        resizeImageFromUrl(imageUrl, { maxWidth: 800 })
      ).rejects.toThrow("Failed to load image");
    });

    it("should set crossOrigin to anonymous", async () => {
      const imageUrl = "https://example.com/image.jpg";
      let capturedCrossOrigin = "";

      global.Image = class MockImage {
        width = 1920;
        height = 1080;
        src = "";
        onload: (() => void) | null = null;
        onerror: ((error: any) => void) | null = null;

        set crossOrigin(value: string) {
          capturedCrossOrigin = value;
        }

        get crossOrigin() {
          return capturedCrossOrigin;
        }

        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      } as any;

      await resizeImageFromUrl(imageUrl, { maxWidth: 800 });

      expect(capturedCrossOrigin).toBe("anonymous");
    });
  });

  describe("resizeImageFromFile", () => {
    beforeEach(() => {
      global.FileReader = class MockFileReader {
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
        result: string | ArrayBuffer | null = null;

        readAsDataURL() {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: "data:image/jpeg;base64,mockdata" }
              } as any);
            }
          }, 0);
        }
      } as any;
    });

    it("should resize image file to specified max width", async () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const maxWidth = 800;

      const result = await resizeImageFromFile(file, { maxWidth });

      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe("test.jpg");
      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(450);
      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it("should reject when blob creation fails", async () => {
      mockCanvas.toBlob = vi.fn((callback) => {
        callback(null);
      }) as any;

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await expect(
        resizeImageFromFile(file, { maxWidth: 800 })
      ).rejects.toThrow("Failed to create blob from canvas");
    });
  });

  describe("getImageDimensions", () => {
    beforeEach(() => {
      global.FileReader = class MockFileReader {
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
        result: string | ArrayBuffer | null = null;

        readAsDataURL() {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: "data:image/jpeg;base64,mockdata" }
              } as any);
            }
          }, 0);
        }
      } as any;
    });

    it("should return dimensions of image file", async () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const dimensions = await getImageDimensions(file);

      expect(dimensions).toEqual({ width: 1920, height: 1080 });
    });

    it("should reject when image fails to load", async () => {
      global.Image = class MockImage {
        width = 1920;
        height = 1080;
        src = "";
        onload: (() => void) | null = null;
        onerror: ((error: any) => void) | null = null;

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error("Failed to load"));
            }
          }, 0);
        }
      } as any;

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await expect(getImageDimensions(file)).rejects.toThrow(
        "Failed to load image"
      );
    });
  });
});
