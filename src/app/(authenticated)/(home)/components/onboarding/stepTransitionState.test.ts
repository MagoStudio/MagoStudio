import { describe, expect, it } from "vitest";

import {
  advanceStepTransition,
  completeStepExit,
  initStepTransition,
  StepTransitionState
} from "./stepTransitionState";

describe("stepTransitionState", () => {
  it("starts with no exiting layer", () => {
    expect(initStepTransition("upload", "A")).toEqual({
      currentKey: "upload",
      currentNode: "A",
      exitingKey: null,
      exitingNode: null
    });
  });

  it("promotes the previous key to exiting when the key changes", () => {
    const state = initStepTransition("upload", "A");
    expect(advanceStepTransition(state, "generate-image", "B")).toEqual({
      currentKey: "generate-image",
      currentNode: "B",
      exitingKey: "upload",
      exitingNode: "A"
    });
  });

  it("is a no-op when the key is unchanged (does not restart the animation)", () => {
    const state: StepTransitionState = {
      currentKey: "generate-image",
      currentNode: "B",
      exitingKey: null,
      exitingNode: null
    };
    expect(advanceStepTransition(state, "generate-image", "B2")).toBe(state);
  });

  it("keeps the latest exiting key when advancing again mid-transition", () => {
    const state: StepTransitionState = {
      currentKey: "generate-image",
      currentNode: "B",
      exitingKey: "upload",
      exitingNode: "A"
    };
    expect(advanceStepTransition(state, "select-image", "C")).toEqual({
      currentKey: "select-image",
      currentNode: "C",
      exitingKey: "generate-image",
      exitingNode: "B"
    });
  });

  it("carries the exiting step's own node, not the incoming one", () => {
    const state = initStepTransition("upload", "A");
    const advanced = advanceStepTransition(state, "generate-image", "B");

    expect(advanced.exitingNode).toBe("A");
    expect(advanced.currentNode).toBe("B");
  });

  it("clears the exiting layer when the exit completes", () => {
    const state: StepTransitionState = {
      currentKey: "generate-image",
      currentNode: "B",
      exitingKey: "upload",
      exitingNode: "A"
    };
    expect(completeStepExit(state)).toEqual({
      currentKey: "generate-image",
      currentNode: "B",
      exitingKey: null,
      exitingNode: null
    });
  });

  it("completeStepExit is a no-op when nothing is exiting", () => {
    const state: StepTransitionState = {
      currentKey: "upload",
      currentNode: "A",
      exitingKey: null,
      exitingNode: null
    };
    expect(completeStepExit(state)).toBe(state);
  });
});
