import { describe, expect, it } from "vitest";

import { getFileDropZoneLayout } from "./getFileDropZoneLayout";

describe("getFileDropZoneLayout", () => {
  describe("medium", () => {
    it("uses flex when empty (drop zone visible alone)", () => {
      expect(getFileDropZoneLayout({ count: 0, maxFileUpload: 9 })).toBe(
        "flex flex-col gap-6"
      );
    });

    it("uses flex when at max capacity so the sole image fills full width", () => {
      expect(getFileDropZoneLayout({ count: 1, maxFileUpload: 1 })).toBe(
        "flex flex-col gap-6"
      );
    });

    it("uses grid when images exist AND an upload slot is still available", () => {
      expect(getFileDropZoneLayout({ count: 1, maxFileUpload: 9 })).toBe(
        "grid grid-cols-2 gap-4"
      );
    });

    it("uses flex when all upload slots are filled", () => {
      expect(getFileDropZoneLayout({ count: 9, maxFileUpload: 9 })).toBe(
        "flex flex-col gap-6"
      );
    });
  });

  describe("small", () => {
    it("spans the full width with one column while empty", () => {
      expect(
        getFileDropZoneLayout({ count: 0, maxFileUpload: 9, size: "small" })
      ).toBe("grid gap-2 auto-rows-[114px] grid-cols-1");
    });

    it("switches to fixed 114px square columns once an image exists", () => {
      expect(
        getFileDropZoneLayout({ count: 1, maxFileUpload: 9, size: "small" })
      ).toBe(
        "grid gap-2 auto-rows-[114px] grid-cols-[repeat(auto-fill,114px)]"
      );
    });

    it("keeps square columns when every upload slot is filled", () => {
      expect(
        getFileDropZoneLayout({ count: 9, maxFileUpload: 9, size: "small" })
      ).toBe(
        "grid gap-2 auto-rows-[114px] grid-cols-[repeat(auto-fill,114px)]"
      );
    });
  });
});
