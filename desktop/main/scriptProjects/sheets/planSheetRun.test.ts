import { describe, expect, it } from "vitest";

import { fingerprint } from "../renderSpec";

import {
  planSheetRun,
  resolveSheetReferences,
  sheetReferencePrompt,
  SheetRunError,
  sheetSpecsInFlight
} from "./planSheetRun";

const key = (token: string, overrides: Record<string, unknown> = {}) => ({
  token,
  name: token,
  prompt: `${token} turnaround`,
  enabled: true,
  images: [],
  ...overrides
});

const plan = (
  keys: Record<string, unknown>[],
  request: Record<string, unknown> = {},
  extra: {
    inFlight?: Map<string, Set<string>>;
    masters?: Record<string, { token: string; assetId: string | null }>;
  } = {}
) =>
  planSheetRun({
    keys,
    request: {
      renderModel: "qwen_image_2512_local",
      outputSize: [1024, 1024],
      ...request
    },
    inFlight: extra.inFlight ?? new Map(),
    visualStyle: "",
    masterFor: (candidate) => extra.masters?.[String(candidate.token)] ?? null
  });

describe("planSheetRun", () => {
  it("skips disabled keys and a pinned upload, and renders the rest", () => {
    const run = plan([
      key("mara"),
      key("ben", { enabled: false }),
      key("field", { effective_source: "upload" })
    ]);
    expect(run.preview).toEqual({
      would_run: ["mara"],
      skipped: [
        { token: "ben", reason: "disabled" },
        { token: "field", reason: "user-supplied image pinned" }
      ],
      changed: {}
    });
    expect(run.planned[0]!.spec).toEqual({
      kind: "sheet",
      token: "mara",
      prompt: "mara turnaround",
      render_model: "qwen_image_2512_local",
      output_size: [1024, 1024]
    });
  });

  it("falls back from prompt to description to token, like sheet_prompt", () => {
    const run = plan([
      key("a", { prompt: "", description: "A desc" }),
      key("b", { prompt: null, description: null })
    ]);
    expect(run.planned.map((item) => item.prompt)).toEqual(["A desc", "b"]);
  });

  it("skips a key already rendered with these inputs, unless a prompt is typed", () => {
    const first = plan([key("mara")]).planned[0]!;
    const rendered = key("mara", {
      images: [{ asset_id: "a1", fingerprint: first.fingerprint }]
    });
    expect(plan([rendered]).preview.skipped).toEqual([
      { token: "mara", reason: "already rendered with these inputs" }
    ]);
    const typed = plan([rendered], {
      tokens: ["mara"],
      promptOverride: "mara turnaround"
    });
    expect(typed.preview.would_run).toEqual(["mara"]);
  });

  it("skips a key a live plan is rendering with the same spec", () => {
    const value = plan([key("mara")]).planned[0]!.fingerprint;
    const run = plan(
      [key("mara")],
      {},
      {
        inFlight: new Map([["mara", new Set([value])]])
      }
    );
    expect(run.preview.skipped).toEqual([
      { token: "mara", reason: "render already in progress" }
    ]);
  });

  it("queues another render of a key that is rendering when its Render button is pressed", () => {
    const value = plan([key("mara")], {
      tokens: ["mara"],
      promptOverride: "mara turnaround"
    }).planned[0]!.fingerprint;
    const run = plan(
      [key("mara")],
      { tokens: ["mara"], promptOverride: "mara turnaround" },
      { inFlight: new Map([["mara", new Set([value])]]) }
    );
    expect(run.preview.would_run).toEqual(["mara"]);
  });

  it("says what changed since the last render", () => {
    const previous = plan([key("mara")]).planned[0]!.spec;
    const run = plan([key("mara", { prompt: "New", last_spec: previous })]);
    expect(run.preview.changed).toEqual({ mara: ["prompt"] });
  });

  it("renders from references with the instruction, saved over the slot's own", () => {
    const run = plan([key("mara", { reference_asset_ids: ["old"] })], {
      tokens: ["mara"],
      referenceFields: {
        reference_asset_ids: ["r1", "r2"],
        reference_instruction: "Take the coat from the first"
      }
    });
    expect(run.requestedReferences).toEqual({
      reference_asset_ids: ["r1", "r2"],
      reference_instruction: "Take the coat from the first"
    });
    expect(run.planned[0]).toEqual(
      expect.objectContaining({
        referenceAssetIds: ["r1", "r2"],
        prompt:
          "mara turnaround\n\nUse the supplied reference images as follows: " +
          "Take the coat from the first"
      })
    );
    expect(run.planned[0]!.spec).toEqual(
      expect.objectContaining({
        reference_asset_ids: ["r1", "r2"],
        reference_instruction: "Take the coat from the first"
      })
    );
  });

  it("refuses references for more than one key", () => {
    expect(() =>
      plan([key("a"), key("b")], {
        tokens: ["a", "b"],
        referenceFields: { reference_asset_ids: [] }
      })
    ).toThrow(
      "reference images apply to one key: send exactly one entry in tokens"
    );
  });

  it("re-renders a variant whose master renders in the same run", () => {
    const masters = { "mara--coat": { token: "mara", assetId: "m1" } };
    const variant = key("mara--coat");
    const variantFingerprint = plan([variant], {}, { masters }).planned[0]!
      .fingerprint;
    const rendered = {
      ...variant,
      images: [{ asset_id: "v1", fingerprint: variantFingerprint }]
    };
    expect(plan([rendered], {}, { masters }).preview.would_run).toEqual([]);
    expect(
      plan([key("mara"), rendered], {}, { masters }).preview.would_run
    ).toEqual(["mara", "mara--coat"]);
  });

  it("puts the visual style in the spec only when there is one", () => {
    const styled = planSheetRun({
      keys: [key("mara")],
      request: { renderModel: "qwen_image_2512_local" },
      inFlight: new Map(),
      visualStyle: "Painterly",
      masterFor: () => null
    });
    expect(styled.planned[0]!.spec.visual_style).toBe("Painterly");
    expect(styled.planned[0]!.fingerprint).not.toBe(
      fingerprint(plan([key("mara")], { outputSize: [] }).planned[0]!.spec)
    );
  });
});

describe("resolveSheetReferences", () => {
  it("merges over the saved slot and clears the instruction with the images", () => {
    expect(
      resolveSheetReferences(
        { reference_asset_ids: ["a"], reference_instruction: "Old" },
        { reference_instruction: "New" }
      )
    ).toEqual({ reference_asset_ids: ["a"], reference_instruction: "New" });
    expect(
      resolveSheetReferences(
        { reference_asset_ids: ["a"], reference_instruction: "Old" },
        { reference_asset_ids: null }
      )
    ).toEqual({});
  });

  it("refuses what the backend refuses", () => {
    const refuse = (fields: Record<string, unknown>) => () =>
      resolveSheetReferences({}, fields);
    expect(
      refuse({
        reference_asset_ids: ["a", "b", "c", "d"],
        reference_instruction: "x"
      })
    ).toThrow("at most 3 reference images, received 4");
    expect(
      refuse({ reference_asset_ids: ["a", "a"], reference_instruction: "x" })
    ).toThrow("reference_asset_ids must be distinct");
    expect(
      refuse({ reference_asset_ids: ["a"], reference_instruction: 1 })
    ).toThrow("reference_instruction must be a string or null");
    expect(refuse({ reference_asset_ids: "a" })).toThrow(SheetRunError);
  });

  it("keeps references that have no instruction", () => {
    expect(resolveSheetReferences({}, { reference_asset_ids: ["a"] })).toEqual({
      reference_asset_ids: ["a"],
      reference_instruction: ""
    });
  });
});

describe("sheetReferencePrompt", () => {
  it("appends a trimmed instruction", () => {
    expect(sheetReferencePrompt("A hero", "  Use the coat ")).toBe(
      "A hero\n\nUse the supplied reference images as follows: Use the coat"
    );
  });

  it("leaves the prompt alone when the instruction is empty", () => {
    expect(sheetReferencePrompt("A hero", "  ")).toBe("A hero");
    expect(sheetReferencePrompt("A hero", undefined)).toBe("A hero");
  });
});

describe("sheetSpecsInFlight", () => {
  it("collects live sheet plans' planned fingerprints by token", () => {
    expect([
      ...sheetSpecsInFlight([
        {
          status: "RUNNING",
          local_targets: [{ token: "a", _local_fingerprint: "f" }]
        },
        {
          status: "FAILED",
          local_targets: [{ token: "b", _local_fingerprint: "g" }]
        },
        {
          status: "PAUSED",
          local_targets: [{ token: "c", _local_fingerprint: "h" }]
        }
      ]).entries()
    ]).toEqual([["a", new Set(["f"])]]);
  });
});

it("uses landscape character specs and keeps automatic body-plan guesses outside fingerprints", () => {
  const input = key("cat", {
    kind: "character",
    body_plan: "four_legged",
    distinctive_features: ["grey fur"]
  });
  const first = plan([input], { outputSize: [576, 1024] }).planned[0]!;
  expect(first.spec).toMatchObject({
    output_size: [1024, 576],
    body_plan: "four_legged",
    distinctive_features: ["grey fur"]
  });
  const automatic = plan([
    key("cat", { kind: "character", body_plan_auto: "four_legged" })
  ]).planned[0]!;
  const unknown = plan([key("cat", { kind: "character" })]).planned[0]!;
  expect(automatic.fingerprint).toBe(unknown.fingerprint);
  expect(first.fingerprint).not.toBe(
    plan([{ ...input, body_plan: "upright" }], { outputSize: [576, 1024] })
      .planned[0]!.fingerprint
  );
});
