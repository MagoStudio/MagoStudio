import { textOf } from "../../vlm/dialogue";
import { changedFields, fingerprint } from "../renderSpec";
import { applyVisualStyle } from "../visualStyle";

import { sheetOutputSize } from "./characterSheetLayout";

/**
 * Which reference sheets a Generate press renders, and why the rest do not:
 * the backend's sheet generation, with its render-spec fingerprints and
 * reference resolution.
 *
 * The project's visual style enters the spec as on the cloud (`prompt` with
 * the style applied, plus `visual_style` when set). One local addition,
 * entering the spec only when present so it moves no other key's
 * fingerprint: a design variant renders by editing its master's image
 * (`master_asset_id`).
 */

type JsonRecord = Record<string, unknown>;

export const MAX_SHEET_REFERENCES = 3;
const MAX_REFERENCE_INSTRUCTION_CHARS = 8000;
export const REFERENCE_INSTRUCTION_PREFIX =
  "Use the supplied reference images as follows: ";

/** A request the cloud refuses outright (its 400/404 message). */
export class SheetRunError extends Error {}

const isRecord = (value: unknown): value is JsonRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);
const records = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];
const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

/** The one string that renders. */
export const sheetPrompt = (key: JsonRecord): string =>
  textOf(key.prompt || key.description || key.token);

export const sheetReferencePrompt = (
  prompt: string,
  instruction: unknown
): string => {
  const trimmedInstruction = textOf(instruction).trim();
  if (!trimmedInstruction) return prompt;
  return `${prompt}\n\n${REFERENCE_INSTRUCTION_PREFIX}${trimmedInstruction}`;
};

export interface SheetReferences {
  reference_asset_ids?: string[];
  reference_instruction?: string;
}

/**
 * The references a slot holds
 * once `fields` is applied over what it has saved. `{}` when it ends with no
 * images, which clears the instruction too. Existence is the caller's check.
 */
export const resolveSheetReferences = (
  saved: JsonRecord,
  fields: JsonRecord
): SheetReferences => {
  const ids =
    ("reference_asset_ids" in fields
      ? fields.reference_asset_ids
      : saved.reference_asset_ids) ?? [];
  const instruction =
    ("reference_instruction" in fields
      ? fields.reference_instruction
      : saved.reference_instruction) ?? "";
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string"))
    throw new SheetRunError(
      "reference_asset_ids must be a list of asset ids or null"
    );
  if (!ids.length) return {};
  if (ids.length > MAX_SHEET_REFERENCES)
    throw new SheetRunError(
      `at most ${MAX_SHEET_REFERENCES} reference images, received ${ids.length}`
    );
  if (new Set(ids).size !== ids.length)
    throw new SheetRunError("reference_asset_ids must be distinct");
  if (typeof instruction !== "string")
    throw new SheetRunError("reference_instruction must be a string or null");
  if (instruction.length > MAX_REFERENCE_INSTRUCTION_CHARS)
    throw new SheetRunError(
      `reference_instruction must be at most ${MAX_REFERENCE_INSTRUCTION_CHARS} characters`
    );
  return {
    reference_asset_ids: [...(ids as string[])],
    reference_instruction: instruction
  };
};

/** The cloud's sheet spec, plus the local design-variant master. */
export const sheetSpec = (
  key: JsonRecord,
  prompt: string,
  renderModel: string,
  outputSize: unknown[],
  extra: { masterAssetId?: string | null; visualStyle?: string }
): JsonRecord => {
  const spec: JsonRecord = {
    kind: "sheet",
    token: key.token,
    prompt: applyVisualStyle(prompt, extra.visualStyle),
    render_model: renderModel,
    output_size: sheetOutputSize(key.kind, outputSize)
  };
  const referenceIds = strings(key.reference_asset_ids);
  if (referenceIds.length) {
    spec.reference_asset_ids = referenceIds;
    spec.reference_instruction = key.reference_instruction ?? null;
  }
  if (key.body_plan) spec.body_plan = key.body_plan;
  if (
    Array.isArray(key.distinctive_features) &&
    key.distinctive_features.length
  )
    spec.distinctive_features = [...key.distinctive_features];
  if (extra.masterAssetId) spec.master_asset_id = extra.masterAssetId;
  if (extra.visualStyle?.trim()) spec.visual_style = extra.visualStyle.trim();
  return spec;
};

/** The fingerprints a key has finished rendering, read off its images. */
const renderedFingerprints = (key: JsonRecord): Set<string> =>
  new Set(
    records(key.images).flatMap((image) =>
      typeof image.fingerprint === "string" ? [image.fingerprint] : []
    )
  );

export const sheetSpecsInFlight = (
  plans: JsonRecord[]
): Map<string, Set<string>> => {
  const inFlight = new Map<string, Set<string>>();
  for (const plan of plans) {
    if (!["PENDING", "RUNNING"].includes(String(plan.status))) continue;
    for (const target of records(plan.local_targets)) {
      const value = target._local_fingerprint;
      if (typeof value !== "string") continue;
      const token = String(target.token);
      if (!inFlight.has(token)) inFlight.set(token, new Set());
      inFlight.get(token)!.add(value);
    }
  }
  return inFlight;
};

export interface SheetRunRequest {
  renderModel: string;
  outputSize?: unknown[];
  tokens?: string[];
  /** A prompt typed for this one render: renders a new version regardless. */
  promptOverride?: string;
  /** `reference_asset_ids` / `reference_instruction` from the body, when sent. */
  referenceFields?: JsonRecord;
}

export interface PlannedSheet {
  key: JsonRecord;
  token: string;
  /** sheet_prompt, with the reference instruction when it renders from references. */
  prompt: string;
  referenceAssetIds: string[];
  spec: JsonRecord;
  fingerprint: string;
}

export interface SheetRunPlan {
  preview: JsonRecord;
  planned: PlannedSheet[];
  /** The references to save on the one requested key, when the body sent some. */
  requestedReferences: SheetReferences | null;
}

/**
 * The cloud's sheet generation minus the persistence. `keys` are the keys the
 * run covers (the caller applies `tokens`, adding any unrendered master a
 * requested variant needs), in render
 * order (masters before their variants); `masterFor` says which design a
 * variant edits from and the image it currently has. A variant whose master
 * renders in this same run renders too, since its source is about to change.
 * Throws SheetRunError for what the cloud refuses.
 */
export const planSheetRun = ({
  keys,
  request,
  inFlight,
  visualStyle,
  masterFor
}: {
  keys: JsonRecord[];
  request: SheetRunRequest;
  inFlight: Map<string, Set<string>>;
  visualStyle: string;
  masterFor: (
    key: JsonRecord
  ) => { token: string; assetId: string | null } | null;
}): SheetRunPlan => {
  const only = request.tokens;
  let requestedReferences: SheetReferences | null = null;
  if (request.referenceFields) {
    if (!only || only.length !== 1)
      throw new SheetRunError(
        "reference images apply to one key: send exactly one entry in tokens"
      );
    const target = keys.find((key) => key.token === only[0]);
    if (!target) throw new SheetRunError("Sheet group not found");
    requestedReferences = resolveSheetReferences(
      target,
      request.referenceFields
    );
  }
  const isForced =
    typeof request.promptOverride === "string" ||
    !!requestedReferences?.reference_asset_ids?.length;
  const outputSize = request.outputSize ?? [];

  const skipped: JsonRecord[] = [];
  const changed: Record<string, string[]> = {};
  const planned: PlannedSheet[] = [];
  for (const original of keys) {
    const token = textOf(original.token);
    if (original.enabled === false) {
      skipped.push({ token, reason: "disabled" });
      continue;
    }
    const key: JsonRecord =
      requestedReferences !== null
        ? {
            ...original,
            reference_asset_ids: [],
            reference_instruction: null,
            ...requestedReferences
          }
        : original;
    if (
      key.effective_source === "upload" &&
      !requestedReferences &&
      typeof request.promptOverride !== "string"
    ) {
      skipped.push({ token, reason: "user-supplied image pinned" });
      continue;
    }
    const basePrompt =
      typeof request.promptOverride === "string" &&
      only?.includes(token) &&
      request.promptOverride.trim()
        ? request.promptOverride
        : sheetPrompt(key);
    const master = masterFor(key);
    const spec = sheetSpec(key, basePrompt, request.renderModel, outputSize, {
      masterAssetId: master?.assetId,
      visualStyle
    });
    const value = fingerprint(spec);
    const isMasterRendering =
      !!master && planned.some((item) => item.token === master.token);
    if (
      !isForced &&
      !isMasterRendering &&
      renderedFingerprints(key).has(value)
    ) {
      skipped.push({ token, reason: "already rendered with these inputs" });
      continue;
    }
    if (!isForced && inFlight.get(token)?.has(value)) {
      skipped.push({ token, reason: "render already in progress" });
      continue;
    }
    const fields = changedFields(key.last_spec, spec);
    if (fields.length) changed[token] = fields;
    const referenceAssetIds = strings(key.reference_asset_ids);
    planned.push({
      key,
      token,
      prompt: referenceAssetIds.length
        ? sheetReferencePrompt(basePrompt, key.reference_instruction)
        : basePrompt,
      referenceAssetIds,
      spec,
      fingerprint: value
    });
  }
  return {
    preview: {
      would_run: planned.map((item) => item.token),
      skipped,
      changed
    },
    planned,
    requestedReferences
  };
};
