import { afterEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { patchSheetGroup } from "./patchSheetGroup";

const sheetGroup = {
  token: "hero",
  name: "Hero",
  layer_id: "layer-1",
  layer_order: 0,
  enabled: true,
  selected_asset_id: null,
  effective_asset_id: null,
  effective_source: null,
  images: [],
  prompt: "A brave hero"
};

describe("patchSheetGroup reference fields", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "mago");
  });

  it("passes reference fields to a local project edit", async () => {
    const update = vi.fn().mockResolvedValue(sheetGroup);
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "local" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "local",
            type: "script_to_shots"
          })
        },
        scriptProjects: { update }
      }
    });

    await patchSheetGroup({
      projectId: "project-1",
      timelineId: "sheets-1",
      token: "hero",
      referenceAssetIds: ["reference-1"],
      referenceInstruction: "Use the coat"
    });

    expect(update).toHaveBeenCalledWith({
      projectId: "project-1",
      operation: "edit-sheet",
      payload: {
        token: "hero",
        reference_asset_ids: ["reference-1"],
        reference_instruction: "Use the coat"
      }
    });
  });

  it("passes reference fields to a cloud project edit", async () => {
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "cloud" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "cloud",
            type: "script_to_shots"
          })
        }
      }
    });
    const patch = vi
      .spyOn(backendApiClient, "patch")
      .mockResolvedValue({ data: sheetGroup });

    await patchSheetGroup({
      projectId: "project-1",
      timelineId: "sheets-1",
      token: "hero",
      referenceAssetIds: ["reference-1"],
      referenceInstruction: "Use the coat"
    });

    expect(patch).toHaveBeenCalledWith("/timelines/sheets-1/sheets/hero/edit", {
      reference_asset_ids: ["reference-1"],
      reference_instruction: "Use the coat"
    });
  });
});
