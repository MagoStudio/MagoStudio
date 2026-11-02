import { describe, expect, it } from "vitest";

import { buildStoryboardGridImageSource } from "./buildStoryboardGridImageSource";

describe("buildStoryboardGridImageSource", () => {
  it("wraps the grid SVG as an image data URL", () => {
    const imageSource = buildStoryboardGridImageSource({
      panelBoxes: [{ left: 10, top: 60, right: 110, bottom: 238 }],
      hasWhitePaper: true
    });
    expect(imageSource.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(
      true
    );
    expect(decodeURIComponent(imageSource)).toContain(">1</text>");
  });
});
