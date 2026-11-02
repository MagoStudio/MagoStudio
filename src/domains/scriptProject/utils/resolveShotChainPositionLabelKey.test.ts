import { describe, expect, it } from "vitest";

import { resolveShotChainPositionLabelKey } from "./resolveShotChainPositionLabelKey";

describe("resolveShotChainPositionLabelKey", () => {
  it("calls a shot with continuity off a chain start, even though a shot sits above it", () => {
    expect(
      resolveShotChainPositionLabelKey({ isSequentialEnabled: false })
    ).toBe("script_project.sequential_chain_start.label");
  });

  it("says a sequential shot with a predecessor continues from it", () => {
    expect(
      resolveShotChainPositionLabelKey({ isSequentialEnabled: true })
    ).toBe("script_project.sequential_source_shot.label");
  });
});
