import { describe, test, expect } from "vitest";

import {
  quantizeViewportZoomFine,
  quantizeViewportZoomWheel
} from "./viewportPanZoomAtom";

describe("quantizeViewportZoomWheel", () => {
  test("snaps zoom values to the nearest 10% increment", () => {
    expect(quantizeViewportZoomWheel(1)).toBe(1);
    expect(quantizeViewportZoomWheel(1.1)).toBe(1.1);
    expect(quantizeViewportZoomWheel(1.14)).toBe(1.1);
    expect(quantizeViewportZoomWheel(1.16)).toBe(1.2);
  });

  test("snapping a 25%-grid value to the wheel grid lands on the nearest 10%", () => {
    expect(quantizeViewportZoomWheel(1.25)).toBe(1.3);
  });
});

describe("quantizeViewportZoomFine", () => {
  test("keeps 1% precision", () => {
    expect(quantizeViewportZoomFine(1.234)).toBe(1.23);
    expect(quantizeViewportZoomFine(1.236)).toBe(1.24);
  });
});
