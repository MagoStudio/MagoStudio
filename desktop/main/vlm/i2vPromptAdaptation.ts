import { stripQwenReasoning } from "../scriptProjects/stripQwenReasoning";

import { ADAPT_PROMPT_I2V_INSTRUCTION } from "./prompts/adaptPromptI2vMinimaxH3";

/**
 * The local port of the backend — the reference
 * inventory, the deterministic slot-label repair and the per-engine tag
 * rendering — plus the validate/repair loop the script-shot H3 adapter uses,
 * because a local Qwen drifts off-format far more often than Gemini does.
 *
 * Pure: everything model- or database-shaped is passed in, so this is the part
 * that is tested directly.
 */

type JsonRecord = Record<string, unknown>;

export type ReferenceKind = "image" | "video" | "audio";

export type DescribedReferences = Record<ReferenceKind, string[]>;

export type RunTextPrompt = (prompt: string) => Promise<string>;

/** What a caption falls back to when the asset cannot be read (i2v_prompt.py
 *  `_UNKNOWN_*`). Deliberately generic: a wrong guess is worse than an
 *  admission that nothing is known. */
export const UNKNOWN_REFERENCE: Record<ReferenceKind, string> = {
  image: "an image whose contents could not be described",
  video: "a video clip whose contents could not be described",
  audio: "an audio clip whose contents could not be described"
};

/** The engine whose renderer resolves the canonical `<Picture n>` form. */
export const CANONICAL_REFERENCE_TAG_ENGINE = "v9.1.0";

const REFERENCE_TAG_FORMATS: Record<
  string,
  Partial<Record<ReferenceKind, string>>
> = {
  "v9.1.0": {
    image: "<Picture {n}>",
    video: "<Video {n}>",
    audio: "<Audio {n}>"
  },
  minimax_h3_max: { image: "Image {n}", video: "Video {n}" }
};

const CANONICAL_TAG_WORD: Record<ReferenceKind, string> = {
  image: "Picture",
  video: "Video",
  audio: "Audio"
};

const INVENTORY_LABEL: Record<ReferenceKind, string> = {
  image: "IMAGE",
  video: "VIDEO",
  audio: "AUDIO"
};

export const H3_SECTIONS = [
  "subject_definitions",
  "summary",
  "retention_analysis",
  "detailed_description",
  "overall_soundscape",
  "non_diegetic_music"
] as const;

type H3Section = (typeof H3_SECTIONS)[number];

export type AdaptationDocument = Record<H3Section, string>;

const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const TIMESTAMP_DECIMAL_PLACES = 3;

const TASK_TYPES = new Set([
  "keyframe completion",
  "reference generation",
  "video editing",
  "video continuation",
  "audio reuse",
  "audio reference"
]);

/**
 * The local text model runs with a JSON-only system prompt, so the backend
 * instruction's plain-text output rule is swapped for a JSON envelope around
 * the same six sections. `assembleAdaptationDocument` puts the backend's plain
 * text format back together afterwards.
 */
const JSON_ENVELOPE = [
  "OUTPUT ENVELOPE (this replaces the plain-text output rule above and nothing else):",
  "return one JSON object with exactly these six string keys, in this order:",
  `${H3_SECTIONS.join(", ")}.`,
  "Each value is that section's complete text without its label.",
  "Every other rule above still applies to the text inside the values."
].join(" ");

/** i2v_prompt.py `build_reference_inventory`. */
export const buildReferenceInventory = (
  described: DescribedReferences,
  userPrompt: string,
  durationSeconds?: number,
  aspect?: string
): string => {
  const lines: string[] = [];
  if (durationSeconds) lines.push(`DURATION: ${durationSeconds}`);
  if (aspect) lines.push(`ASPECT: ${aspect}`);
  for (const kind of ["image", "video", "audio"] as const) {
    const captions = described[kind];
    if (!captions.length) continue;
    const label = INVENTORY_LABEL[kind];
    lines.push(`${label}S:`);
    captions.forEach((caption, index) =>
      lines.push(`  ${label}_${index + 1}: ${caption}`)
    );
  }
  lines.push(`USER_PROMPT: ${userPrompt}`);
  return lines.join("\n");
};

export const buildAdaptationPrompt = (inventory: string): string =>
  [ADAPT_PROMPT_I2V_INSTRUCTION, JSON_ENVELOPE, inventory].join("\n\n");

/** Same retry the script-shot adapter sends when Qwen's answer is cut off. */
export const buildTruncationRetryPrompt = (prompt: string): string =>
  [
    prompt,
    "",
    "RETRY REQUIREMENT: The previous response was truncated or was not a JSON object.",
    "Return the complete six-key JSON object immediately. Keep internal reasoning brief and keep detailed_description near the 350-word minimum."
  ].join("\n");

/** Same repair the script-shot adapter sends when the document fails validation. */
export const buildRepairPrompt = (
  prompt: string,
  rejected: JsonRecord,
  errors: string[]
): string =>
  [
    prompt,
    "The previous JSON failed validation. Repair it and return only the complete corrected six-key JSON object.",
    `VALIDATION_ERRORS: ${errors.join("; ")}`,
    `REJECTED_JSON: ${JSON.stringify(rejected)}`
  ].join("\n\n");

export const parseAdaptationOutput = (answer: string): JsonRecord | null => {
  try {
    const parsed = JSON.parse(stripQwenReasoning(answer)) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonRecord)
      : null;
  } catch {
    return null;
  }
};

/** The six sections as non-empty strings, or null when any is missing. */
const toDocument = (value: JsonRecord): AdaptationDocument | null => {
  const document = {} as AdaptationDocument;
  for (const section of H3_SECTIONS) {
    const body = value[section];
    if (typeof body !== "string" || !body.trim()) return null;
    document[section] = body.trim();
  }
  return document;
};

/**
 * i2v_prompt.py `_SLOT_LABEL_FIXES`: the inventory shows the model IMAGE_k but
 * the renderer only resolves <Picture k>, and the model makes that translation
 * only about half the time — so it is redone here deterministically.
 */
const SLOT_LABEL_FIXES: Array<[RegExp, string, string]> = [
  [/<\s*IMAGE[_\s]*(\d+)\s*>/gi, "<Picture $1>", "IMAGE_k -> <Picture k>"],
  [/<\s*VIDEO[_\s]*(\d+)\s*>/gi, "<Video $1>", "VIDEO_k -> <Video k>"],
  [/<\s*AUDIO[_\s]*(\d+)\s*>/gi, "<Audio $1>", "AUDIO_k -> <Audio k>"],
  [/<\s*picture[_\s]*(\d+)\s*>/g, "<Picture $1>", "lowercase <picture k>"]
];

export const repairSlotLabels = (
  text: string
): { text: string; warnings: string[] } => {
  const warnings: string[] = [];
  let repaired = text;
  for (const [pattern, replacement, name] of SLOT_LABEL_FIXES) {
    const count = repaired.match(pattern)?.length ?? 0;
    const rewritten = repaired.replace(pattern, replacement);
    // The patterns are case-insensitive, so an already-correct <Video 1>
    // rewrites to itself. Report only a real change.
    if (count && rewritten !== repaired)
      warnings.push(`rewrote ${count} ${name} label(s)`);
    repaired = rewritten;
  }
  return { text: repaired, warnings };
};

const citedNumbers = (text: string, word: string): number[] =>
  [...text.matchAll(new RegExp(`<${word} (\\d+)>`, "g"))].map((match) =>
    Number(match[1])
  );

/** A label numbered past the references actually wired points at nothing. */
export const findLabelsPastEnd = (
  text: string,
  described: DescribedReferences,
  kinds: ReferenceKind[] = ["image", "video", "audio"]
): string[] =>
  kinds.flatMap((kind) => {
    const word = CANONICAL_TAG_WORD[kind];
    const available = described[kind].length;
    const pastEnd = [...new Set(citedNumbers(text, word))]
      .filter((number) => number > available)
      .sort((left, right) => left - right);
    return pastEnd.length
      ? [
          `cites <${word} [${pastEnd.join(", ")}]> but only ${available} ${kind} reference(s) were sent`
        ]
      : [];
  });

/** i2v_prompt.py `render_engine_slot_labels`: canonical tags → the surface form
 *  `engine` actually resolves. */
export const renderEngineSlotLabels = (
  text: string,
  engine: string
): { text: string; warnings: string[] } => {
  const formats = REFERENCE_TAG_FORMATS[engine];
  if (engine === CANONICAL_REFERENCE_TAG_ENGINE || !formats)
    return { text, warnings: [] };
  const warnings: string[] = [];
  let rendered = text;
  for (const kind of Object.keys(CANONICAL_TAG_WORD) as ReferenceKind[]) {
    const word = CANONICAL_TAG_WORD[kind];
    const pattern = new RegExp(`<${word} (\\d+)>`, "g");
    const format = formats[kind];
    if (!format) {
      // Left in place and reported: dropping it would silently delete the
      // sentence's subject.
      if (pattern.test(rendered))
        warnings.push(
          `${engine} takes no ${kind} references; left <${word} n> as written`
        );
      continue;
    }
    const count = rendered.match(pattern)?.length ?? 0;
    rendered = rendered.replace(pattern, (_, number: string) =>
      format.replace("{n}", number)
    );
    if (count)
      warnings.push(`rendered ${count} <${word} n> tag(s) into ${engine} form`);
  }
  return { text: rendered, warnings };
};

/**
 * What the backend instruction's self-check asks for that can be checked from
 * the outside: the six sections, every reference cited and none invented, the
 * task-type prefix, [Shot 1], subjects defined before use, cuts inside the
 * duration. Run on labels already repaired by `repairSlotLabels`.
 */
export const validateAdaptationDocument = (
  value: JsonRecord,
  described: DescribedReferences,
  durationSeconds?: number
): string[] => {
  const errors: string[] = [];
  for (const section of H3_SECTIONS) {
    const body = value[section];
    if (typeof body !== "string" || !body.trim())
      errors.push(`missing section ${section}`);
  }
  for (const key of Object.keys(value)) {
    if (!(H3_SECTIONS as readonly string[]).includes(key))
      errors.push(`unexpected section ${key}`);
  }
  const document = toDocument(value);
  if (!document) return errors;

  const combined = H3_SECTIONS.map((section) => document[section]).join("\n");
  for (const kind of ["image", "video"] as const) {
    const word = CANONICAL_TAG_WORD[kind];
    const cited = new Set(citedNumbers(combined, word));
    described[kind].forEach((_, index) => {
      if (!cited.has(index + 1))
        errors.push(`reference <${word} ${index + 1}> is never cited`);
    });
  }
  // Audio is left out on purpose: a video's own soundtrack can legitimately be
  // cited as <Audio n> with no audio reference sent, so it is only reported.
  errors.push(...findLabelsPastEnd(combined, described, ["image", "video"]));

  const prefix = /^\[([^\]]+)]/.exec(document.summary);
  if (!prefix) {
    errors.push("summary must begin with a [task type] prefix");
  } else {
    const types = prefix[1]!.split("+").map((type) => type.trim());
    for (const type of types) {
      if (!TASK_TYPES.has(type)) errors.push(`unknown task type "${type}"`);
    }
    if (new Set(types).size !== types.length)
      errors.push("task type prefix repeats a type");
  }

  if (!document.detailed_description.includes("[Shot 1]"))
    errors.push("detailed_description must include [Shot 1]");

  const defined = new Set(
    citedNumbers(document.subject_definitions, "Subject")
  );
  for (const number of new Set(citedNumbers(combined, "Subject"))) {
    if (!defined.has(number))
      errors.push(`<Subject ${number}> is not defined in subject_definitions`);
  }

  if (durationSeconds) {
    const cuts = document.detailed_description.matchAll(
      /\[Shot \d+] At (\d{2}):(\d{2})\.(\d{3})/g
    );
    for (const cut of cuts) {
      const seconds =
        Number(cut[1]) * SECONDS_PER_MINUTE +
        Number(cut[2]) +
        Number(cut[3]) / MILLISECONDS_PER_SECOND;
      if (seconds <= 0 || seconds >= durationSeconds)
        errors.push(
          `cut at ${seconds.toFixed(TIMESTAMP_DECIMAL_PLACES)}s is outside the shot`
        );
    }
  }
  return [...new Set(errors)];
};

/** The backend's plain-text output: each lowercase label, a colon, its body. */
export const assembleAdaptationDocument = (
  document: AdaptationDocument
): string =>
  H3_SECTIONS.map((section) => `${section}:\n${document[section]}`).join(
    "\n\n"
  );

const repairDocumentLabels = (
  value: JsonRecord
): { value: JsonRecord; warnings: string[] } => {
  const warnings: string[] = [];
  const repaired: JsonRecord = { ...value };
  for (const section of H3_SECTIONS) {
    const body = repaired[section];
    if (typeof body !== "string") continue;
    const result = repairSlotLabels(body);
    repaired[section] = result.text;
    warnings.push(...result.warnings);
  }
  return { value: repaired, warnings };
};

export interface I2vAdaptationResult {
  adapted_prompt: string;
  adapted: boolean;
  engine?: string;
  label_warnings?: string[];
  reference_inventory?: string;
}

/**
 * i2v_prompt.py `adapt_i2v_prompt` from the inventory on, with one extra model
 * call at most: a truncation retry when the answer isn't JSON, or a repair
 * when it fails validation.
 *
 * A model answer that cannot be used falls back to the raw prompt with
 * `adapted: false`, as the backend does. A failure to reach the model at all
 * (ComfyUI down, weights missing) throws instead: there is no answer to fall
 * back from, and the user needs to see why.
 */
export const adaptI2vPrompt = async (input: {
  userPrompt: string;
  described: DescribedReferences;
  engine?: string;
  durationSeconds?: number;
  aspect?: string;
  run: RunTextPrompt;
}): Promise<I2vAdaptationResult> => {
  const engine = input.engine || CANONICAL_REFERENCE_TAG_ENGINE;
  const inventory = buildReferenceInventory(
    input.described,
    input.userPrompt,
    input.durationSeconds,
    input.aspect
  );
  const prompt = buildAdaptationPrompt(inventory);
  const unadapted: I2vAdaptationResult = {
    adapted_prompt: input.userPrompt,
    adapted: false
  };

  const attempt = (answer: string) => {
    const parsed = parseAdaptationOutput(answer);
    if (!parsed) return null;
    const { value, warnings } = repairDocumentLabels(parsed);
    return {
      value,
      warnings,
      errors: validateAdaptationDocument(
        value,
        input.described,
        input.durationSeconds
      )
    };
  };

  let result = attempt(await input.run(prompt));
  if (!result) {
    result = attempt(await input.run(buildTruncationRetryPrompt(prompt)));
  } else if (result.errors.length) {
    const repaired = attempt(
      await input.run(buildRepairPrompt(prompt, result.value, result.errors))
    );
    // Keep the first answer if the repair came back worse: one with all six
    // sections still renders, with its problems reported as warnings.
    if (repaired && (toDocument(repaired.value) || !toDocument(result.value)))
      result = repaired;
  }

  const document = result ? toDocument(result.value) : null;
  if (!result || !document) return unadapted;

  const assembled = assembleAdaptationDocument(document);
  const rendered = renderEngineSlotLabels(assembled, engine);
  return {
    adapted_prompt: rendered.text,
    adapted: true,
    engine,
    label_warnings: [
      ...new Set([
        ...result.warnings,
        ...result.errors,
        ...findLabelsPastEnd(assembled, input.described, ["audio"]),
        ...rendered.warnings
      ])
    ],
    reference_inventory: inventory
  };
};
