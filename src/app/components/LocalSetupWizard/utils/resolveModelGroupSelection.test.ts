import { describe, expect, it } from "vitest";

import { resolveModelGroupSelection } from "./resolveModelGroupSelection";

describe("resolveModelGroupSelection", () => {
  it("always installs Minimal, even when it is partial and the user unchecked it", () => {
    expect(
      resolveModelGroupSelection({
        groupId: "minimal",
        state: "partial",
        userChoice: false
      })
    ).toEqual({ isChecked: true, isLocked: true });
  });

  it("locks an installed group as checked", () => {
    expect(
      resolveModelGroupSelection({
        groupId: "qwen-image",
        state: "installed",
        userChoice: false
      })
    ).toEqual({ isChecked: true, isLocked: true });
  });

  it("preselects a partial group but lets the user skip the update", () => {
    expect(
      resolveModelGroupSelection({
        groupId: "flux-image",
        state: "partial",
        userChoice: undefined
      })
    ).toEqual({ isChecked: true, isLocked: false });
    expect(
      resolveModelGroupSelection({
        groupId: "flux-image",
        state: "partial",
        userChoice: false
      }).isChecked
    ).toBe(false);
  });

  it("leaves a group that is not installed unchecked until the user picks it", () => {
    expect(
      resolveModelGroupSelection({
        groupId: "local-llm",
        state: "not-installed",
        userChoice: undefined
      }).isChecked
    ).toBe(false);
    expect(
      resolveModelGroupSelection({
        groupId: "local-llm",
        state: "not-installed",
        userChoice: true
      }).isChecked
    ).toBe(true);
  });
});
