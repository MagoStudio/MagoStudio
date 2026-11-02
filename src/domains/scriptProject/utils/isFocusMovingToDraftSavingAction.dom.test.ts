import { describe, expect, it } from "vitest";

import {
  DRAFT_SAVING_ACTION_ATTRIBUTE,
  isFocusMovingToDraftSavingAction
} from "./isFocusMovingToDraftSavingAction";

describe("isFocusMovingToDraftSavingAction", () => {
  it("is true when focus moves to an action that saves the draft itself", () => {
    const action = document.createElement("button");
    action.setAttribute(DRAFT_SAVING_ACTION_ATTRIBUTE, "true");

    expect(isFocusMovingToDraftSavingAction(action)).toBe(true);
  });

  it("is true when focus moves to an element inside such an action", () => {
    const action = document.createElement("button");
    action.setAttribute(DRAFT_SAVING_ACTION_ATTRIBUTE, "true");
    const label = document.createElement("span");
    action.appendChild(label);

    expect(isFocusMovingToDraftSavingAction(label)).toBe(true);
  });

  it("is false when focus moves to any other element", () => {
    expect(
      isFocusMovingToDraftSavingAction(document.createElement("button"))
    ).toBe(false);
  });

  it("is false when focus leaves the page", () => {
    expect(isFocusMovingToDraftSavingAction(null)).toBe(false);
  });
});
