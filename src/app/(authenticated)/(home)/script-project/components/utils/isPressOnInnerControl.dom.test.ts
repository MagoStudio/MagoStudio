import { describe, expect, it } from "vitest";

import { isPressOnInnerControl } from "./isPressOnInnerControl";

describe("isPressOnInnerControl", () => {
  it("treats a press inside a button or slider as an inner control", () => {
    const button = document.createElement("button");
    const icon = document.createElement("span");
    button.append(icon);
    const slider = document.createElement("div");
    slider.setAttribute("role", "slider");
    expect(isPressOnInnerControl(icon)).toBe(true);
    expect(isPressOnInnerControl(slider)).toBe(true);
  });

  it("treats a press on plain content as a press on the card", () => {
    const card = document.createElement("div");
    const video = document.createElement("video");
    card.append(video);
    expect(isPressOnInnerControl(video)).toBe(false);
    expect(isPressOnInnerControl(null)).toBe(false);
  });
});
