import { describe, test, expect, vi } from "vitest";

import { routeVideoFiles } from "./routeVideoFiles";

const videoFile = (name: string) => new File([], name, { type: "video/mp4" });
const textFile = (name: string) => new File([], name, { type: "text/plain" });

describe("routeVideoFiles", () => {
  test("does nothing when there are no video files", () => {
    const onSingleFile = vi.fn();
    const onBulkUpload = vi.fn();

    routeVideoFiles({
      files: [textFile("notes.txt")],
      projectId: "p1",
      onSingleFile,
      onBulkUpload
    });

    expect(onSingleFile).not.toHaveBeenCalled();
    expect(onBulkUpload).not.toHaveBeenCalled();
  });

  test("routes a single video to onSingleFile", () => {
    const onSingleFile = vi.fn();
    const onBulkUpload = vi.fn();
    const file = videoFile("a.mp4");

    routeVideoFiles({
      files: [file, textFile("notes.txt")],
      projectId: "p1",
      onSingleFile,
      onBulkUpload
    });

    expect(onSingleFile).toHaveBeenCalledWith(file);
    expect(onBulkUpload).not.toHaveBeenCalled();
  });

  test("routes multiple videos to onBulkUpload with the project id", () => {
    const onSingleFile = vi.fn();
    const onBulkUpload = vi.fn();
    const files = [videoFile("a.mp4"), videoFile("b.mp4")];

    routeVideoFiles({
      files,
      projectId: "p1",
      onSingleFile,
      onBulkUpload
    });

    expect(onBulkUpload).toHaveBeenCalledWith(files, "p1");
    expect(onSingleFile).not.toHaveBeenCalled();
  });

  test("does not bulk upload multiple videos without a project id", () => {
    const onSingleFile = vi.fn();
    const onBulkUpload = vi.fn();

    routeVideoFiles({
      files: [videoFile("a.mp4"), videoFile("b.mp4")],
      projectId: undefined,
      onSingleFile,
      onBulkUpload
    });

    expect(onSingleFile).not.toHaveBeenCalled();
    expect(onBulkUpload).not.toHaveBeenCalled();
  });
});
