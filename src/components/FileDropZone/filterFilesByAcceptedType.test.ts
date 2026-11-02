import { describe, expect, it } from "vitest";

import { filterFilesByAcceptedType } from "./filterFilesByAcceptedType";

const buildFile = (name: string, type: string) =>
  new File(["content"], name, { type });

describe("filterFilesByAcceptedType", () => {
  it("accepts every file whose type is in the accepted list", () => {
    const files = [
      buildFile("a.png", "image/png"),
      buildFile("b.jpg", "image/jpeg")
    ];

    const { acceptedFiles, firstRejectedFile } = filterFilesByAcceptedType(
      files,
      ["image/jpg", "image/jpeg", "image/png"]
    );

    expect(acceptedFiles).toEqual(files);
    expect(firstRejectedFile).toBeUndefined();
  });

  it("rejects a file whose type is not in the accepted list, e.g. SVG", () => {
    const files = [buildFile("a.svg", "image/svg+xml")];

    const { acceptedFiles, firstRejectedFile } = filterFilesByAcceptedType(
      files,
      ["image/jpg", "image/jpeg", "image/png"]
    );

    expect(acceptedFiles).toEqual([]);
    expect(firstRejectedFile).toBe(files[0]);
  });

  it("keeps only the accepted files and reports the first rejected one, out of a mixed batch", () => {
    const goodFile = buildFile("a.png", "image/png");
    const badFile = buildFile("b.svg", "image/svg+xml");
    const anotherGoodFile = buildFile("c.jpg", "image/jpeg");

    const { acceptedFiles, firstRejectedFile } = filterFilesByAcceptedType(
      [goodFile, badFile, anotherGoodFile],
      ["image/jpg", "image/jpeg", "image/png"]
    );

    expect(acceptedFiles).toEqual([goodFile, anotherGoodFile]);
    expect(firstRejectedFile).toBe(badFile);
  });

  it("treats an empty file list as fully accepted (nothing to reject)", () => {
    const { acceptedFiles, firstRejectedFile } = filterFilesByAcceptedType(
      [],
      ["image/png"]
    );

    expect(acceptedFiles).toEqual([]);
    expect(firstRejectedFile).toBeUndefined();
  });
});
