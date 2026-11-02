import { createStore } from "jotai";
import { describe, test, expect } from "vitest";

import { isPreviewMutedAtom } from "./isPreviewMutedAtom";

describe("isPreviewMutedAtom", () => {
  test("preview audio defaults to unmuted", () => {
    expect(createStore().get(isPreviewMutedAtom)).toBe(false);
  });
});
