import { describe, expect, it } from "vitest";

import { createRequestedSheetGroup } from "./createRequestedSheetGroup";

const existingKeys = [
  { token: "mara", name: "Mara", layer_order: 0 },
  { token: "harbour", name: "Harbour", layer_order: 3 }
];

describe("createRequestedSheetGroup", () => {
  it("creates a group for the one unknown token with its name, kind and prompt", () => {
    expect(
      createRequestedSheetGroup({
        existingKeys,
        requestedTokens: ["baker"],
        sheetGroupToCreate: { name: "The Baker", kind: "character" },
        prompt: "A baker in flour-dusted overalls"
      })
    ).toEqual({
      token: "baker",
      name: "The Baker",
      kind: "character",
      description: null,
      seed_description: null,
      prompt: "A baker in flour-dusted overalls",
      enabled: true,
      layer_id: expect.any(String),
      layer_order: 4,
      selected_asset_id: null,
      effective_asset_id: null,
      effective_source: null,
      images: []
    });
  });

  it("names the group after its token when no name is sent, as the cloud does", () => {
    expect(
      createRequestedSheetGroup({
        existingKeys: [],
        requestedTokens: ["baker"],
        sheetGroupToCreate: {},
        prompt: undefined
      })
    ).toMatchObject({
      token: "baker",
      name: "baker",
      kind: null,
      prompt: null,
      layer_order: 0
    });
  });

  it("leaves an existing group alone", () => {
    expect(
      createRequestedSheetGroup({
        existingKeys,
        requestedTokens: ["mara"],
        sheetGroupToCreate: { name: "Someone else", kind: "character" },
        prompt: "New prompt"
      })
    ).toBeNull();
  });

  it("creates nothing unless creation is requested for exactly one token", () => {
    expect(
      createRequestedSheetGroup({
        existingKeys,
        requestedTokens: ["baker"],
        sheetGroupToCreate: undefined,
        prompt: "A baker"
      })
    ).toBeNull();
    expect(
      createRequestedSheetGroup({
        existingKeys,
        requestedTokens: ["baker", "butcher"],
        sheetGroupToCreate: { name: "Baker" },
        prompt: "A baker"
      })
    ).toBeNull();
  });
});
