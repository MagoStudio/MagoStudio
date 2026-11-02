import { describe, expect, it } from "vitest";

import type { LocalModelGroupsStatus } from "../../../../../desktop/shared/contracts";
import { starterEngineRequiredBytes } from "../../../../../desktop/shared/localModelManifest";

import { requiredBytesForModelGroups } from "./requiredBytesForModelGroups";

const statusWith = (isGetStartedInstall: boolean): LocalModelGroupsStatus => ({
  isGetStartedInstall,
  installRootFreeBytes: null,
  groups: [
    { groupId: "minimal", state: "not-installed", missingBytes: 100 },
    { groupId: "local-llm", state: "not-installed", missingBytes: 20 },
    { groupId: "qwen-image", state: "partial", missingBytes: 3 },
    { groupId: "flux-image", state: "installed", missingBytes: 0 }
  ]
});

describe("requiredBytesForModelGroups", () => {
  it("adds the engine and the checked groups on a first install", () => {
    expect(
      requiredBytesForModelGroups({
        modelGroupsStatus: statusWith(false),
        checkedModelGroupIds: ["minimal", "local-llm"]
      })
    ).toBe(starterEngineRequiredBytes() + 120);
  });

  it("counts only the missing files of checked groups when modifying an install", () => {
    expect(
      requiredBytesForModelGroups({
        modelGroupsStatus: statusWith(true),
        checkedModelGroupIds: ["qwen-image", "flux-image"]
      })
    ).toBe(3);
  });
});
