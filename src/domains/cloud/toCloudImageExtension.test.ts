import { describe, expect, it } from "vitest";

import { toCloudImageExtension } from "./toCloudImageExtension";

describe("toCloudImageExtension", () => {
  it("keeps the extensions cloud Mago accepts", () => {
    expect(toCloudImageExtension("jpg")).toBe("jpg");
    expect(toCloudImageExtension("jpeg")).toBe("jpeg");
    expect(toCloudImageExtension("png")).toBe("png");
  });

  it("normalises case and a leading dot", () => {
    expect(toCloudImageExtension(".JPG")).toBe("jpg");
  });

  it("registers every other format as the png it is converted to", () => {
    expect(toCloudImageExtension("webp")).toBe("png");
    expect(toCloudImageExtension("gif")).toBe("png");
    expect(toCloudImageExtension("")).toBe("png");
  });
});
