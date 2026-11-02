import { describe, expect, it } from "vitest";

import { buildDownloadFilename } from "./buildDownloadFilename";

describe("buildDownloadFilename", () => {
  it("appends a jpg extension to a bare name", () => {
    expect(buildDownloadFilename("dana_v1")).toBe("dana_v1.jpg");
  });

  it("keeps a name that already carries an extension", () => {
    expect(buildDownloadFilename("dana_v1.png")).toBe("dana_v1.png");
  });

  it("strips trailing dots before deciding", () => {
    expect(buildDownloadFilename("dana_v1...")).toBe("dana_v1.jpg");
  });

  it("falls back when the name is undefined", () => {
    expect(buildDownloadFilename(undefined)).toBe("image.jpg");
  });

  it("falls back when the name is empty", () => {
    expect(buildDownloadFilename("")).toBe("image.jpg");
  });
});
