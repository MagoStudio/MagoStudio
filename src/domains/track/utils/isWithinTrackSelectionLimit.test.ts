import { describe, expect, it } from "vitest";

import { isWithinTrackSelectionLimit } from "./isWithinTrackSelectionLimit";

describe("isWithinTrackSelectionLimit", () => {
  it.each([0, 1, 2])(
    "returns true for a selection of %d tracks — every remaining preview mode can display it",
    (selectionCount) => {
      expect(isWithinTrackSelectionLimit(selectionCount)).toBe(true);
    }
  );

  it.each([3, 4, 5])(
    "returns false for a selection of %d tracks — the widest remaining mode only shows two",
    (selectionCount) => {
      expect(isWithinTrackSelectionLimit(selectionCount)).toBe(false);
    }
  );
});
