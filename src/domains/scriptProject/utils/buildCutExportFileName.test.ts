import { describe, expect, it } from "vitest";

import { buildCutExportFileName } from "./buildCutExportFileName";

describe("buildCutExportFileName", () => {
  it("names the file after the project", () => {
    expect(buildCutExportFileName("The Three Musketeers", "mp4")).toBe(
      "The Three Musketeers.mp4"
    );
  });

  it("uses the extension it is given", () => {
    expect(buildCutExportFileName("Musketeers", "zip")).toBe("Musketeers.zip");
  });

  it("replaces characters a filesystem would reject", () => {
    expect(buildCutExportFileName('Act 1: "the duel" <draft>', "mp4")).toBe(
      "Act 1_ _the duel_ _draft_.mp4"
    );
  });

  it("replaces path separators, so the name cannot escape the download folder", () => {
    expect(buildCutExportFileName("../../etc/passwd", "mp4")).toBe(
      "_.._etc_passwd.mp4"
    );
  });

  it("strips leading dots rather than making a hidden file", () => {
    expect(buildCutExportFileName(".hidden", "mp4")).toBe("hidden.mp4");
  });

  it("truncates a long project name to 200 bytes", () => {
    const longName = "a".repeat(500);

    const fileName = buildCutExportFileName(longName, "mp4");

    expect(fileName).toBe(`${"a".repeat(200)}.mp4`);
  });

  it("counts bytes, not characters, so multi-byte names stay within the budget", () => {
    const fileName = buildCutExportFileName("é".repeat(200), "mp4");
    const stem = fileName.replace(/\.mp4$/, "");

    expect(new TextEncoder().encode(stem).length).toBeLessThanOrEqual(200);
    expect(stem.length).toBe(100);
  });

  it("falls back to a usable name when the project has none", () => {
    expect(buildCutExportFileName(null, "mp4")).toBe("cut.mp4");
    expect(buildCutExportFileName("", "zip")).toBe("cut.zip");
    expect(buildCutExportFileName("   ", "mp4")).toBe("cut.mp4");
  });

  it("does not leave a Windows device name standing alone", () => {
    expect(buildCutExportFileName("CON", "mp4")).toBe("_CON.mp4");
  });
});
