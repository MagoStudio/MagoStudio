// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { scrollToShotInContainer } from "./scrollToShotInContainer";

describe("scrollToShotInContainer", () => {
  it("smoothly centers the selected sequence card", () => {
    const container = document.createElement("div");
    const first = document.createElement("div");
    const selected = document.createElement("div");
    first.dataset.shotTimelineId = "shot-1";
    selected.dataset.shotTimelineId = "shot-2";
    selected.scrollIntoView = vi.fn();
    container.append(first, selected);

    expect(scrollToShotInContainer(container, "shot-2")).toBe(true);
    expect(selected.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  });

  it("does nothing when the sequence is not in the filtered list", () => {
    const container = document.createElement("div");
    expect(scrollToShotInContainer(container, "missing")).toBe(false);
  });
});
