import { describe, expect, it } from "vitest";

import { deriveProjectNameFromFilename } from "./deriveProjectNameFromFilename";

describe("deriveProjectNameFromFilename", () => {
  it("strips the extension and takes the first 10 characters", () => {
    expect(deriveProjectNameFromFilename("Project_summer_ep01.mp4")).toBe(
      "Project_su"
    );
  });

  it("keeps names shorter than 10 characters intact", () => {
    expect(deriveProjectNameFromFilename("beach.mp4")).toBe("beach");
  });

  it("handles filenames without an extension", () => {
    expect(deriveProjectNameFromFilename("my_home_movie")).toBe("my_home_mo");
  });

  it("only strips the final extension", () => {
    expect(deriveProjectNameFromFilename("archive.tar.gz")).toBe("archive.ta");
  });

  it("returns null for an extension-only filename", () => {
    expect(deriveProjectNameFromFilename(".mp4")).toBeNull();
  });

  it("returns null for an empty filename", () => {
    expect(deriveProjectNameFromFilename("")).toBeNull();
  });
});
