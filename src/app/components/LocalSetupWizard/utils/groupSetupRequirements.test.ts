import { describe, expect, it } from "vitest";

import type { ScriptSetupRequirement } from "../../../../../desktop/shared/contracts";

import { groupSetupRequirements } from "./groupSetupRequirements";
const item = (
  name: string,
  kind: "node" | "core" | "model",
  url = "https://example.com/pack"
): ScriptSetupRequirement => ({
  name,
  installKind: kind,
  url,
  status: "missing"
});
describe("setup requirement grouping", () => {
  it("groups core nodes and packs while retaining separate model files", () => {
    const groups = groupSetupRequirements(
      [
        item("CoreA", "core", "core"),
        item("CoreB", "core", "core"),
        item("Loader", "node"),
        item("Caption", "node"),
        item("modelA", "model"),
        item("modelB", "model")
      ],
      false
    );
    expect(groups).toHaveLength(4);
    expect(groups[0].names).toEqual(["CoreA", "CoreB"]);
    expect(groups[1].names).toEqual(["Loader", "Caption"]);
  });
  it("omits installed nodes unless previewing missing requirements", () => {
    const installed = {
      ...item("Loader", "node"),
      status: "installed" as const
    };
    expect(groupSetupRequirements([installed], false)).toEqual([]);
    expect(
      groupSetupRequirements([installed, installed], true)[0].names
    ).toEqual(["Loader"]);
  });
});
