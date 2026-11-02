import { describe, expect, it } from "vitest";

import { buildStoryboardGridSvg } from "./buildStoryboardGridSvg";

const panelBoxes = [
  { left: 100, top: 200, right: 400, bottom: 733 },
  { left: 432, top: 200, right: 732, bottom: 733 }
];

describe("buildStoryboardGridSvg", () => {
  it("draws one bordered, numbered panel per box at the storyboard size", () => {
    const svg = buildStoryboardGridSvg({ panelBoxes, hasWhitePaper: true });
    expect(svg).toContain('width="1536" height="864"');
    expect(svg.match(/fill="none" stroke="#000"/g)).toHaveLength(2);
    expect(svg).toContain(">1</text>");
    expect(svg).toContain(">2</text>");
    expect(svg).toContain('<rect x="103" y="203" width="294" height="527"');
  });

  it("leaves the paper transparent when drawn under a sketch", () => {
    expect(
      buildStoryboardGridSvg({ panelBoxes, hasWhitePaper: false })
    ).not.toContain('fill="#fff"/><rect x');
  });
});
