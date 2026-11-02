/* oxlint-disable eslint/no-magic-numbers -- screenplay limits, hashes and progress percentages are domain constants kept next to their use */
import { createHash, randomUUID } from "node:crypto";

import type {
  LocalScriptProjectMedia,
  LocalScriptProjectSnapshot,
  LocalScriptTextModel,
  LocalScriptCastInput,
  LocalScriptCutExportInput,
  LocalScriptSheetsInput,
  LocalScriptShotsInput
} from "../../shared/contracts";
import type { RunCloudTextModel } from "../../shared/textModelRequest";
import { ProjectRepository } from "../database/projectRepository";
import { ScriptProjectSnapshotRepository } from "../database/scriptProjectSnapshotRepository";
import { probeComfyRenderModel } from "../imageRenders/comfyModelValidation";
import type { ShotVideoEvaluationInput } from "../vlm/videoMetrics";

import {
  applyShotEdit,
  editedShotResponse,
  SHOT_EDIT_STATUS,
  ShotEditError,
  validateAddedShot,
  validateShotEdit
} from "./casting/editShot";
import {
  materialiseCasting,
  parseTargetDurationS,
  SHOT_ENGINES
} from "./casting/materialiseCasting";
import { createQwenStructuredCall } from "./casting/qwenStructuredCall";
import { CastingCallError, generateCasting } from "./casting/scriptCasting";
import {
  ComfyScriptProjectClient,
  LocalH3Model,
  LocalH3Steps,
  LocalH3TextEncoder,
  LOCAL_SCRIPT_TEXT_MODEL_FILES,
  resolveLocalScriptImageModel
} from "./comfyScriptProjectClient";
import {
  concatenateVideos,
  createReferenceGrid,
  extractFirstFrame,
  extractKeyframeGrid,
  extractLastFrame
} from "./localScriptMedia";
import { fingerprint } from "./renderSpec";
import {
  characterSheetPrompt,
  resolveBodyPlan,
  sheetOutputSize,
  classifyBodyPlan
} from "./sheets/characterSheetLayout";
import { createRequestedSheetGroup } from "./sheets/createRequestedSheetGroup";
import {
  planSheetRun,
  resolveSheetReferences,
  SheetReferences,
  SheetRunError,
  sheetSpecsInFlight,
  REFERENCE_INSTRUCTION_PREFIX
} from "./sheets/planSheetRun";
import { LocalShotMetrics } from "./shots/localShotMetrics";
import {
  planShotRun,
  ShotRunError,
  shotSpecsInFlight
} from "./shots/planShotRun";
import { buildProjectCutView, emptyCutShotEntry } from "./shots/projectCutView";
import { shotReadView, withProjectReadViews } from "./shots/projectReadViews";
import { SEQUENTIAL_SHOT_REFERENCE_DESCRIPTION } from "./shots/sequentialContinuation";
import { insertManualShot, placeShot } from "./shots/shotOrder";
import { resolveCutShot, shotPinError } from "./shots/shotPin";
import { withUnfinishedSequentialDependents } from "./shots/withUnfinishedSequentialDependents";
import { buildStoryboardPrompt } from "./storyboards/buildStoryboardPrompt";
import {
  isStoryboard,
  sceneCuts,
  sceneFingerprint,
  storyboardReference,
  storyboardState,
  storyboardToken
} from "./storyboards/storyboard";
import { templatePng } from "./storyboards/template";
import { stripQwenReasoning } from "./stripQwenReasoning";
import { supersedeResumablePlanSteps } from "./supersedeResumablePlanSteps";
import { createQwenVideoPromptCall } from "./videoPrompt/qwenVideoPromptCall";
import {
  buildShotVideoPromptBody,
  shotPromptWithSequentialAppendix,
  storedCaptionFor
} from "./videoPrompt/shotVideoPromptBody";
import { generateVideoPrompt } from "./videoPrompt/videoPrompt";
import {
  Continuation,
  GROUP_ORDER,
  planReferenceSlots,
  sequentialContinuation
} from "./videoPrompt/videoPromptPayload";
import {
  applyVisualStyle,
  castVisualStyleSeed,
  readProjectVisualStyle,
  visualStyleError
} from "./visualStyle";
export { stripQwenReasoning } from "./stripQwenReasoning";

type JsonRecord = Record<string, unknown>;

/**
 * Where the local cast switches from one combined call to structure-then-
 * prompts. The backend's threshold is 15,000 words, sized for Gemini 2.5
 * Pro's 1M-token input and 64k output; the local text model runs with a 32k
 * context that the script, the instructions and a 16k-token answer all share,
 * so the lighter two-call path has to start much earlier.
 */
const LOCAL_CASTING_SINGLE_CALL_MAX_WORDS = 6000;

type ResolvedCastInput = LocalScriptCastInput & {
  maxShots: number;
  isAtomicShotsRequested: boolean;
  isRenderSequencesRequested: boolean;
  engine: string | null;
  targetDurationS: number | null;
};

/** The cloud's cast options: its defaults, checks and messages. */
export const resolveCastOptions = (
  input: LocalScriptCastInput
): ResolvedCastInput => {
  const maxShots = input.maxShots ?? 30;
  if (!Number.isInteger(maxShots))
    throw new Error("max_shots must be an integer");
  if (maxShots < 1 || maxShots > 200)
    throw new Error("max_shots must be between 1 and 200");
  const atomicShots = input.isAtomicShotsRequested ?? true;
  const renderSequences = input.isRenderSequencesRequested ?? atomicShots;
  const engine = input.engine ?? null;
  if (engine !== null && !(SHOT_ENGINES as readonly string[]).includes(engine))
    throw new Error(`engine must be one of: ${SHOT_ENGINES.join(", ")}`);
  if (renderSequences && !atomicShots)
    throw new Error(
      "render_sequences cannot be used with atomic_shots=false — there would be no beats to pack"
    );
  const [targetDurationS, targetDurationError] = parseTargetDurationS(
    input.targetDurationS
  );
  if (targetDurationError) throw new Error(targetDurationError);
  return {
    ...input,
    maxShots,
    isAtomicShotsRequested: atomicShots,
    isRenderSequencesRequested: renderSequences,
    engine,
    targetDurationS
  };
};

type DescribeEntityImage = (
  sourcePath: string,
  kind: string
) => Promise<string>;

const record = (value: unknown): JsonRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const records = (value: unknown): JsonRecord[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const candidate = record(item);
        return candidate ? [candidate] : [];
      })
    : [];

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const numbers = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter((item): item is number => typeof item === "number")
    : [];

const textValue = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const hasOwnSheetDescription = (key: JsonRecord, image: JsonRecord): boolean =>
  image.has_description === true &&
  typeof image.description === "string" &&
  // Older local builds copied the casting seed onto every rendered image and
  // marked it as a caption. Treat that unmarked duplicate as missing so an old
  // project is backfilled before its next MiniMax render.
  (typeof image.description_source === "string" ||
    image.description !== key.seed_description);

export const resolveLocalH3Steps = (value: unknown): LocalH3Steps =>
  value === 3 || value === 4 || value === 8 ? value : 4;

export const resolveLocalH3TextEncoder = (
  value: unknown
): LocalH3TextEncoder => (value === "heretic" ? "heretic" : "vanilla");

export const resolveLocalH3Model = (value: unknown): LocalH3Model =>
  value === "singularity" ? "singularity" : "base";

const designMasterToken = (key: JsonRecord): string | null => {
  const explicit = textValue(key.master_token, "");
  if (explicit) return explicit;
  const token = textValue(key.token ?? key.token_name, "");
  const separator = token.indexOf("--");
  return separator > 0 ? token.slice(0, separator) : null;
};

const isDesignVariant = (key: JsonRecord): boolean =>
  textValue(key.alt, "default").toLowerCase() !== "default" ||
  designMasterToken(key) !== null;

export const buildDesignVariantEditPrompt = (
  target: JsonRecord,
  requestedPrompt: string,
  visualStyle?: string
): string => {
  const name = textValue(target.name, textValue(target.token, "asset"));
  const alt = textValue(target.alt, "design variant");
  const kind = textValue(target.kind, "asset");
  const preservationRule =
    kind === "character"
      ? "Preserve the exact same character identity, face, hair, age, body proportions, pose-sheet layout, and rendering style."
      : "Preserve the exact same subject identity, silhouette, proportions, viewpoint layout, and rendering style.";
  return [
    `Edit the supplied master image of ${name} into the \"${alt}\" design version.`,
    preservationRule,
    "Change only the attributes required by this version. Do not replace, redesign, or add another subject.",
    "Requested version changes:",
    applyVisualStyle(requestedPrompt, visualStyle)
  ]
    .filter(Boolean)
    .join("\n");
};

export const ensureDesignMasterKeys = (
  keys: JsonRecord[]
): { keys: JsonRecord[]; addedTokens: string[] } => {
  const result = keys.map((key) => ({ ...key }));
  const byToken = new Map(result.map((key) => [textValue(key.token, ""), key]));
  const addedTokens: string[] = [];
  for (const variant of result.filter(isDesignVariant)) {
    const masterToken = designMasterToken(variant);
    if (!masterToken) continue;
    variant.master_token = masterToken;
    if (byToken.has(masterToken)) continue;
    const name = textValue(variant.name, masterToken);
    const description = textValue(
      variant.seed_description,
      textValue(variant.description, name)
    );
    const master: JsonRecord = {
      token: masterToken,
      name,
      kind: variant.kind ?? null,
      alt: "default",
      master_token: null,
      is_design_master: true,
      description,
      seed_description: description,
      prompt: `${description}. Canonical master reference design for ${name}; preserve this identity and structure in every version.`,
      enabled: true,
      layer_id: randomUUID(),
      layer_order: Number(variant.layer_order ?? result.length) - 0.5,
      selected_asset_id: null,
      effective_asset_id: null,
      effective_source: null,
      images: []
    };
    result.push(master);
    byToken.set(masterToken, master);
    addedTokens.push(masterToken);
  }
  return { keys: result, addedTokens };
};

const nowIso = (): string => new Date().toISOString();

type RunControl = {
  planId: string;
  projectId: string;
  cancelled: boolean;
};

type LocalPlanOperation = "cast" | "sheets" | "shots" | "cut";

const createStep = (
  planId: string,
  projectId: string,
  stepOrder: number,
  toolName: string,
  timelineId?: string,
  toolArgs?: JsonRecord
): JsonRecord => ({
  id: randomUUID(),
  plan_id: planId,
  project_id: projectId,
  timeline_id: timelineId ?? null,
  step_order: stepOrder,
  tool_name: toolName,
  tool_args: toolArgs ?? {},
  status: "PENDING",
  result: null,
  error: null,
  retry_count: 0,
  max_retries: 0,
  started_at: null,
  finished_at: null,
  created_at: nowIso()
});

const createPlan = (
  id: string,
  projectId: string,
  name: string,
  operation: LocalPlanOperation,
  request: JsonRecord,
  steps: JsonRecord[]
): JsonRecord => {
  const now = nowIso();
  return {
    id,
    status: "PENDING",
    name,
    project_id: projectId,
    input_data: {
      project_id: projectId,
      timeline_ids: [
        ...new Set(
          steps
            .map((step) => step.timeline_id)
            .filter((value): value is string => typeof value === "string")
        )
      ],
      video_settings: operation === "shots" ? request.videoSettings : undefined
    },
    local_operation: operation,
    local_request: request,
    total_steps: steps.length,
    completed_steps: 0,
    progress_pct: 0,
    error: null,
    created_at: now,
    updated_at: now,
    steps
  };
};

const planAt = (
  plan: JsonRecord,
  status: string,
  error?: string
): JsonRecord => {
  const steps = records(plan.steps);
  const completedSteps = steps.filter((step) =>
    ["COMPLETED", "SKIPPED"].includes(String(step.status))
  ).length;
  const total = steps.length || Number(plan.total_steps) || 1;
  const currentStep = steps.find((step) => step.status === "RUNNING") ?? null;
  return {
    ...plan,
    status,
    completed_steps: completedSteps,
    progress_pct: Math.round((Math.min(completedSteps, total) / total) * 100),
    current_step: currentStep,
    updated_at: nowIso(),
    ...(status === "RUNNING" && !plan.started_at
      ? { started_at: nowIso() }
      : {}),
    ...(status === "COMPLETED" || status === "FAILED" || status === "CANCELLED"
      ? { finished_at: nowIso() }
      : {}),
    error: error ? { message: error } : null
  };
};

const completedStep = (step: JsonRecord | undefined): boolean =>
  step?.status === "COMPLETED" || step?.status === "SKIPPED";

/** The text a sheet renders with: a design variant asks the edit model to
 * turn its master into this version; anything else gets the visual style. */
const composeSheetRenderPrompt = (
  key: JsonRecord,
  prompt: string,
  visualStyle: string,
  outputSize?: unknown[]
): string => {
  const appearance = designMasterToken(key)
    ? buildDesignVariantEditPrompt(key, prompt, visualStyle)
    : applyVisualStyle(prompt, visualStyle);
  if (key.kind !== "character") return appearance;
  const marker = `\n\n${REFERENCE_INSTRUCTION_PREFIX}`;
  const at = appearance.indexOf(marker);
  const base = at < 0 ? appearance : appearance.slice(0, at);
  const instruction = at < 0 ? "" : appearance.slice(at);
  return (
    characterSheetPrompt(
      base,
      resolveBodyPlan(key.body_plan) ?? resolveBodyPlan(key.body_plan_auto),
      sheetOutputSize(key.kind, outputSize ?? [])
    ) + instruction
  );
};

/** Reference images the local MiniMax H3 workflow takes (MAGO_REF2VID_MAX_REF_IMAGES). */
const LOCAL_H3_IMAGE_REFERENCE_SLOTS = 9;
const referenceImageSlotBudget = (
  sequential: JsonRecord | null,
  hasStoryboard: boolean
): number =>
  LOCAL_H3_IMAGE_REFERENCE_SLOTS -
  (sequential?.mode === "last_frame" || sequential?.mode === "key_frames"
    ? 1
    : 0) -
  Number(hasStoryboard);

/** Mago Cloud sheet models a signed-in local project may render with. */
const CLOUD_SHEET_RENDER_MODELS = new Set([
  "seedream_5_pro_t2i",
  "gpt_image_2_t2i",
  "nanobanana_2_t2i"
]);
/** `local_executor` of a sheet plan the renderer runs against Mago Cloud. */
const CLOUD_SHEET_EXECUTOR = "mago-cloud-renderer";

export class LocalScriptProjectService {
  private readonly projectRuns = new Map<
    string,
    { control: RunControl; promise: Promise<void> }
  >();
  private readonly pendingDescriptions = new Map<string, Promise<JsonRecord>>();
  /** Cloud sheet plans are run by the renderer; the project stays busy until
   * it reports the last image, a failure, or the plan is cancelled. */
  private readonly rendererPlanWaiters = new Map<string, () => void>();
  /** Local Asset renders requested while the project runs another job. They
   * reach ComfyUI only when that job ends, so a restart cannot lose them in
   * ComfyUI's own queue; after a restart `getPlan` pauses them. */
  private readonly queuedRuns = new Map<
    string,
    Array<{ planId: string; task: (control: RunControl) => Promise<void> }>
  >();
  private readonly shotMetrics: LocalShotMetrics;
  private readonly storyboardRequests = new Set<string>();
  private readonly storyboardPreparation = new Map<string, Promise<unknown>>();
  private readonly projectStateWrites = new Map<string, Promise<unknown>>();

  constructor(
    private readonly projects: ProjectRepository,
    private readonly snapshots: ScriptProjectSnapshotRepository,
    private readonly getComfyEndpoint: () => Promise<string>,
    private readonly getScriptTextModel: () => Promise<LocalScriptTextModel> = async () =>
      "qwen38-27b-q5",
    private readonly describeEntityImage?: DescribeEntityImage,
    private readonly runCloudTextModel: RunCloudTextModel = async () => null,
    private readonly evaluateShotVideo?: (
      input: ShotVideoEvaluationInput
    ) => Promise<JsonRecord>
  ) {
    this.shotMetrics = new LocalShotMetrics({
      read: (id) => this.snapshots.getMediaMetrics(id),
      write: (id, metrics) => this.snapshots.putMediaMetrics(id, metrics),
      resolveInput: (id) => this.shotMetricsInput(id),
      evaluate: (input) => {
        if (!this.evaluateShotVideo)
          throw new Error("Local video evaluator is unavailable");
        return this.evaluateShotVideo(input);
      }
    });
  }

  async getRenderMetrics(assetId: string): Promise<JsonRecord> {
    const media = await this.findMedia({ assetId });
    if (media?.kind !== "shot-version")
      throw new Error("Local shot version not found");
    return this.shotMetrics.get(assetId);
  }

  private async shotMetricsInput(
    assetId: string
  ): Promise<ShotVideoEvaluationInput> {
    const media = await this.findMedia({ assetId });
    if (media?.kind !== "shot-version")
      throw new Error("Local shot version not found");
    const snapshot = await this.requireSnapshot(media.projectId);
    const version = records(snapshot.cut?.shots)
      .flatMap((shot) => records(shot.versions))
      .find((candidate) => candidate.asset_id === assetId);
    if (!version?.ready) throw new Error("Local shot version is not ready");
    const stored = record(version.metrics_input);
    const spec = record(version.render_spec);
    const settings = record(version.input_settings);
    const prompt = stored?.prompt ?? spec?.video_prompt;
    const durationSeconds = stored?.duration_s ?? settings?.duration_s;
    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      typeof durationSeconds !== "number"
    )
      throw new Error(
        "This version has no saved prompt or duration for evaluation"
      );
    const references = stored
      ? strings(stored.reference_asset_ids)
      : Object.values(record(spec?.references) ?? {}).flatMap(strings);
    const sourcePath = await this.snapshots.resolveMediaPath(assetId);
    if (!sourcePath) throw new Error("Local video is unavailable");
    const referencePaths: string[] = [];
    for (const id of new Set(references)) {
      const path =
        (await this.snapshots.resolveMediaPath(id)) ??
        (await this.projects.resolveMediaPath("asset", id));
      if (!path) throw new Error(`Evaluation reference ${id} is unavailable`);
      referencePaths.push(path);
    }
    return { sourcePath, prompt, durationSeconds, referencePaths };
  }

  async getSnapshot(
    projectId: string
  ): Promise<LocalScriptProjectSnapshot | null> {
    const stored = await this.snapshots.get(projectId);
    if (!stored) return stored;
    const project = await this.projects.get(projectId);
    if (project?.origin !== "local") return stored;
    const snapshot = {
      ...stored,
      scriptVersions: this.versionsWithPlanStatus(
        stored.scriptVersions,
        stored.planDetails
      )
    };
    if (!snapshot.state) return snapshot;
    for (const [planId, plan] of Object.entries(snapshot.planDetails ?? {})) {
      if (
        ["PENDING", "RUNNING"].includes(String(plan.status)) &&
        records(plan.local_targets).some(isStoryboard) &&
        this.projectRuns.get(projectId)?.control.planId !== planId &&
        !this.isRunQueued(projectId, planId)
      ) {
        const recovered = await this.getPlan(planId);
        if (recovered && snapshot.planDetails)
          snapshot.planDetails[planId] = recovered;
      }
    }
    const state = structuredClone(snapshot.state);
    const visualStyle = await this.projectVisualStyle(projectId, state);
    if (visualStyle || "visual_style" in state)
      state.visual_style = visualStyle;
    state.shots = records(state.shots).map((shot) => ({
      ...shot,
      storyboard: storyboardState(
        shot,
        records(state.keys),
        Object.values(snapshot.planDetails ?? {})
      )
    }));
    snapshot.state = state;
    const ensured = ensureDesignMasterKeys(records(state.keys));
    if (!ensured.addedTokens.length)
      return withProjectReadViews(projectId, snapshot);
    state.keys = ensured.keys;
    const refreshed = this.refreshReferences(state);
    await this.snapshots.put({
      projectId,
      state: refreshed,
      metadataOnly: true
    });
    return withProjectReadViews(projectId, { ...snapshot, state: refreshed });
  }

  /**
   * A version's status is its plan's, and its
   * summary is the materialise step's result — read live rather than stored,
   * so a version shows PENDING/RUNNING while it casts and UNKNOWN when its
   * plan is gone, exactly as the cloud's list does.
   */
  private versionsWithPlanStatus(
    scriptVersions: JsonRecord | null,
    plans: LocalScriptProjectSnapshot["planDetails"]
  ): JsonRecord | null {
    if (!scriptVersions) return scriptVersions;
    const versions = records(scriptVersions.versions).map((entry) => {
      const planId = textValue(entry.plan_id, "");
      // Plans and versions come from the same fresh snapshot. Looking up a
      // plan separately scans and parses every project's plan history.
      const plan = plans?.[planId];
      const materialise = records(plan?.steps).find(
        (step) => step.tool_name === "materialise_project_state"
      );
      return {
        ...entry,
        status: textValue(plan?.status, "UNKNOWN"),
        summary: record(materialise?.result) ?? null
      };
    });
    return { ...scriptVersions, versions };
  }

  async cast(
    rawInput: LocalScriptCastInput
  ): Promise<{ version: number; plan_id: string }> {
    const input = resolveCastOptions(rawInput);
    await this.assertLocalProject(input.projectId);
    this.assertIdle(input.projectId);
    const snapshot = await this.snapshots.get(input.projectId);
    if (records(snapshot?.state?.shots).length)
      throw new Error(
        "This project already has shots; casting a script into it again is disabled"
      );
    const versions = records(snapshot?.scriptVersions?.versions);
    const version =
      Math.max(0, ...versions.map((item) => Number(item.version) || 0)) + 1;
    const planId = randomUUID();
    const steps = [
      createStep(
        planId,
        input.projectId,
        0,
        "submit_script_casting",
        undefined,
        {
          script: input.script,
          shot_limit: input.maxShots,
          atomic_shots: input.isAtomicShotsRequested,
          sequence_mode: input.isRenderSequencesRequested,
          include_dialogue: true
        }
      ),
      createStep(planId, input.projectId, 1, "poll_script_casting"),
      createStep(planId, input.projectId, 2, "materialise_project_state")
    ];
    const plan = createPlan(
      planId,
      input.projectId,
      "Cast local script",
      "cast",
      { ...input, version },
      steps
    );
    await this.snapshots.putPlan(input.projectId, planId, plan);
    // POST /projects/:id/script records the version, and makes it the active
    // one, as soon as casting starts — not when it finishes.
    await this.snapshots.put({
      projectId: input.projectId,
      scriptVersions: {
        ...(snapshot?.scriptVersions ?? {}),
        active_version: version,
        versions: [
          ...versions,
          {
            version,
            plan_id: planId,
            created_at: nowIso(),
            max_shots: input.maxShots,
            render_sequences: input.isRenderSequencesRequested,
            engine: input.engine,
            target_duration_s: input.targetDurationS ?? null
          }
        ]
      }
    });
    this.startRun(input.projectId, planId, (control) =>
      this.runCastingPlan(input, version, plan, control)
    );
    return { version, plan_id: planId };
  }

  async cancelPlan(planId: string): Promise<JsonRecord> {
    const plan = await this.requireLocallyRunPlan(planId);
    const projectId = String(plan.project_id);
    const running = this.projectRuns.get(projectId);
    if (running?.control.planId === planId) running.control.cancelled = true;
    this.removeQueuedRun(projectId, planId);
    const cancelled = structuredClone(plan);
    cancelled.steps = records(cancelled.steps).map((step) =>
      ["PENDING", "RUNNING", "FAILED"].includes(String(step.status))
        ? {
            ...step,
            status: "SKIPPED",
            finished_at: nowIso(),
            error: null,
            result: { reason: "cancelled" }
          }
        : step
    );
    const updated = planAt(cancelled, "CANCELLED");
    await this.snapshots.putPlan(projectId, planId, updated);
    this.releaseRenderer(planId);
    return updated;
  }

  async getPlan(planId: string): Promise<JsonRecord | null> {
    const plan = await this.snapshots.getPlan(planId);
    if (!plan || !["PENDING", "RUNNING"].includes(String(plan.status))) {
      return plan;
    }
    const projectId =
      typeof plan.project_id === "string" ? plan.project_id : "";
    const project = projectId ? await this.projects.get(projectId) : null;
    if (
      !project ||
      project.origin === "cloud" ||
      this.projectRuns.get(projectId)?.control.planId === planId ||
      this.isRunQueued(projectId, planId)
    ) {
      return plan;
    }
    const recovered = structuredClone(plan);
    recovered.steps = records(recovered.steps).map((step) =>
      step.status === "RUNNING"
        ? {
            ...step,
            status: "FAILED",
            finished_at: nowIso(),
            error: {
              message: "The desktop app stopped while this step was running"
            }
          }
        : step
    );
    const paused = planAt(
      recovered,
      "PAUSED",
      "The desktop app stopped during this local plan; resume to continue"
    );
    await this.snapshots.putPlan(projectId, planId, paused);
    return paused;
  }

  async resumePlan(planId: string): Promise<JsonRecord> {
    const plan = await this.requireLocallyRunPlan(planId);
    const projectId = String(plan.project_id);
    await this.assertLocalProject(projectId);
    this.assertIdle(projectId);
    if (!["PAUSED", "FAILED"].includes(String(plan.status))) {
      throw new Error("Only a paused local plan can be resumed");
    }
    const resumed = structuredClone(plan);
    resumed.steps = records(resumed.steps).map((step) =>
      step.status === "FAILED"
        ? {
            ...step,
            status: "PENDING",
            error: null,
            started_at: null,
            finished_at: null,
            retry_count: Number(step.retry_count ?? 0) + 1
          }
        : step
    );
    const pending = planAt(resumed, "PENDING");
    await this.snapshots.putPlan(projectId, planId, pending);
    const request = record(plan.local_request);
    const operation = plan.local_operation;
    if (!request)
      throw new Error("Local plan cannot be resumed: request missing");
    if (plan.local_executor === CLOUD_SHEET_EXECUTOR) {
      // The renderer picks the plan back up (resumePlan.local).
      this.waitForRenderer(
        projectId,
        planId,
        records(plan.local_targets).some(isStoryboard)
      );
      return pending;
    }
    this.startRun(projectId, planId, async (control) => {
      if (operation === "cast") {
        await this.runCastingPlan(
          request as unknown as LocalScriptCastInput,
          Number(request.version),
          pending,
          control
        );
      } else if (operation === "sheets") {
        const input = request as unknown as LocalScriptSheetsInput;
        // The planned targets carry their prompt and spec; a plan made
        // before they were stored re-derives its keys from the request.
        const planned = records(plan.local_targets);
        const snapshot = await this.requireSnapshot(projectId);
        const keys = planned.length
          ? planned
          : records(snapshot.state?.keys).filter(
              (key) =>
                !input.tokens?.length ||
                input.tokens.includes(String(key.token))
            );
        await this.renderSheets(input, keys, pending, control);
      } else if (operation === "shots") {
        const input = request as unknown as LocalScriptShotsInput;
        const shots = records(plan.local_targets);
        await this.renderShots(input, shots, pending, control);
      } else if (operation === "cut") {
        await this.runCutExport(
          request as unknown as LocalScriptCutExportInput,
          strings(plan.local_paths),
          textValue(plan.local_fingerprint, ""),
          pending,
          control
        );
      } else {
        throw new Error("Unknown local plan operation");
      }
    });
    return pending;
  }

  /**
   * Which local script project owns this media, so asset-keyed calls (render
   * metrics, image inputs, descriptions) can answer locally instead of asking
   * the cloud about an id it has never seen. Cloud mirrors are not matched:
   * their media keeps its cloud ids and the cloud answers for it.
   */
  async findMedia(query: {
    assetId?: string;
    clipId?: string;
  }): Promise<LocalScriptProjectMedia | null> {
    if (!query.assetId && !query.clipId) return null;
    for (const projectId of await this.snapshots.listProjectIds()) {
      const project = await this.projects.get(projectId);
      if (!project || project.origin === "cloud") continue;
      const snapshot = await this.snapshots.get(projectId);
      const image = records(snapshot?.state?.keys)
        .flatMap((key) => records(key.images))
        .find((candidate) =>
          query.clipId
            ? candidate.clip_id === query.clipId
            : candidate.asset_id === query.assetId
        );
      if (image) return { projectId, kind: "sheet-image", image };
      if (!query.assetId) continue;
      const hasShotVersion = records(snapshot?.cut?.shots).some((shot) =>
        records(shot.versions).some(
          (version) => version.asset_id === query.assetId
        )
      );
      if (hasShotVersion)
        return { projectId, kind: "shot-version", image: null };
    }
    return null;
  }

  async generateSheets(input: LocalScriptSheetsInput): Promise<JsonRecord> {
    return this.generateSheetsInternal(input);
  }

  async generateShots(input: LocalScriptShotsInput): Promise<JsonRecord> {
    return this.generateShotsInternal(input);
  }

  async exportCut(input: LocalScriptCutExportInput): Promise<JsonRecord> {
    await this.assertLocalProject(input.projectId);
    const snapshot = await this.requireSnapshot(input.projectId);
    const cut = snapshot.cut;
    const shots = records(
      buildProjectCutView({
        projectId: input.projectId,
        stateShots: records(snapshot.state?.shots),
        storedCut: cut
      }).shots
    );
    const unrenderedShots = shots.filter(
      (shot) => typeof shot.asset_id !== "string"
    );
    if (unrenderedShots.length || !shots.length) {
      const refusedShots = unrenderedShots.length ? unrenderedShots : shots;
      return {
        would_export: [],
        profile: null,
        refused: [
          {
            reason: "missing_pinned_video",
            sequence_ids: refusedShots.map((shot) => shot.sequence_id ?? null),
            timeline_ids: refusedShots.map((shot) => shot.timeline_id),
            profiles: []
          }
        ],
        plan_id: null,
        asset_id: null,
        reused: false
      };
    }
    const assetIds = shots.map((shot) => String(shot.asset_id));
    const fingerprint = createHash("sha256")
      .update(assetIds.join("\0"))
      .digest("hex");
    const existingExport = record(cut?.export);
    if (
      !input.isDryRun &&
      existingExport?.fingerprint === fingerprint &&
      typeof existingExport.asset_id === "string" &&
      typeof existingExport.url === "string"
    ) {
      return {
        would_export: shots.map((shot) => shot.sequence_id ?? null),
        profile: null,
        refused: [],
        plan_id: null,
        asset_id: existingExport.asset_id,
        reused: true
      };
    }
    const resolvedPaths = await Promise.all(
      assetIds.map(
        async (assetId) =>
          (await this.snapshots.resolveMediaPath(assetId)) ??
          (await this.projects.resolveMediaPath("asset", assetId))
      )
    );
    const sequenceIds = shots.map((shot) => shot.sequence_id ?? null);
    const unavailableShots = shots.filter(
      (_shot, index) => !resolvedPaths[index]
    );
    if (unavailableShots.length) {
      return {
        would_export: [],
        profile: null,
        refused: [
          {
            reason: "missing_pinned_video",
            sequence_ids: unavailableShots.map(
              (shot) => shot.sequence_id ?? null
            ),
            timeline_ids: unavailableShots.map((shot) => shot.timeline_id),
            profiles: []
          }
        ],
        plan_id: null,
        asset_id: null,
        reused: false
      };
    }
    const paths = resolvedPaths.filter(
      (resolved): resolved is string => typeof resolved === "string"
    );
    const answer = {
      would_export: sequenceIds,
      profile: {
        sequence_ids: sequenceIds,
        timeline_ids: shots.map((shot) => shot.timeline_id)
      },
      refused: [],
      plan_id: null,
      asset_id: null,
      reused: false
    };
    if (input.isDryRun) return answer;
    this.assertIdle(input.projectId);
    const planId = randomUUID();
    const steps = [
      createStep(planId, input.projectId, 0, "run_summary", undefined, {
        operation: "export_cut",
        asset_ids: assetIds
      })
    ];
    const plan = createPlan(
      planId,
      input.projectId,
      "Export local script cut",
      "cut",
      input as unknown as JsonRecord,
      steps
    );
    plan.local_paths = paths;
    plan.local_fingerprint = fingerprint;
    await this.snapshots.putPlan(input.projectId, planId, plan);
    this.startRun(input.projectId, planId, (control) =>
      this.runCutExport(input, paths, fingerprint, plan, control)
    );
    return { ...answer, plan_id: planId };
  }

  async update(input: {
    projectId: string;
    operation:
      | "edit-sheet"
      | "add-sheet-image"
      | "describe-sheet"
      | "pin-sheet"
      | "add-shot"
      | "edit-shot"
      | "pin-shot"
      | "edit-image-description"
      | "start-cloud-sheet-render"
      | "add-cloud-sheet-render"
      | "fail-cloud-sheet-render"
      | "storyboard"
      | "storyboard-generate"
      | "storyboard-update";
    payload: JsonRecord;
  }): Promise<JsonRecord> {
    await this.assertLocalProject(input.projectId);
    if (input.operation === "storyboard-generate")
      return this.generateStoryboard(input.projectId, input.payload);
    if (
      input.operation === "storyboard" ||
      input.operation === "storyboard-update"
    )
      return this.withProjectStateWrite(input.projectId, () =>
        this.readOrUpdateStoryboard(
          input.projectId,
          input.payload,
          input.operation === "storyboard-update"
        )
      );
    if (input.operation === "describe-sheet") {
      return this.requestSheetDescription(
        input.projectId,
        textValue(input.payload.token, ""),
        typeof input.payload.assetId === "string"
          ? input.payload.assetId
          : undefined,
        input.payload.shouldOverwrite === true,
        true
      );
    }
    const snapshot = await this.requireSnapshot(input.projectId);
    if (input.operation === "edit-sheet") {
      const state = structuredClone(snapshot.state!);
      const key = records(state.keys).find(
        (candidate) => candidate.token === input.payload.token
      );
      if (!key) throw new Error("Local reference-sheet entity not found");
      if ("body_plan" in input.payload) {
        const value = input.payload.body_plan;
        if (value !== null && !resolveBodyPlan(value))
          throw new Error(
            "body_plan must be upright, four_legged or null (auto)"
          );
        if (value === null) delete key.body_plan;
        else key.body_plan = value;
      }
      for (const field of ["name", "prompt", "enabled"]) {
        if (input.payload[field] !== undefined)
          key[field] = input.payload[field];
      }
      if (input.payload.description !== undefined) {
        const effectiveImage = records(key.images).find(
          (image) => image.asset_id === key.effective_asset_id
        );
        if (effectiveImage) {
          effectiveImage.description = input.payload.description;
          effectiveImage.has_description = true;
          effectiveImage.description_source = "user";
        } else {
          key.seed_description = input.payload.description;
        }
        key.description = input.payload.description;
      }
      // As the cloud's sheet edit: references are merged over what the slot
      // has saved; saving them renders nothing.
      const referenceFields = Object.fromEntries(
        ["reference_asset_ids", "reference_instruction"]
          .filter((field) => field in input.payload)
          .map((field) => [field, input.payload[field]])
      );
      if (Object.keys(referenceFields).length) {
        const references = resolveSheetReferences(key, referenceFields);
        if (references.reference_asset_ids)
          await this.assertReferenceImagesExist(references.reference_asset_ids);
        delete key.reference_asset_ids;
        delete key.reference_instruction;
        Object.assign(key, references);
      }
      await this.snapshots.put({
        projectId: input.projectId,
        state: this.refreshReferences(state)
      });
      return key;
    }
    if (input.operation === "add-sheet-image") {
      const initialKey = records(snapshot.state?.keys).find(
        (candidate) => candidate.token === input.payload.token
      );
      if (!initialKey)
        throw new Error("Local reference-sheet entity not found");
      const assetId = textValue(input.payload.assetId, "");
      const sourcePath = assetId
        ? await this.projects.resolveMediaPath("asset", assetId)
        : null;
      if (!assetId || !sourcePath)
        throw new Error("Local uploaded image not found");
      const latestSnapshot = await this.requireSnapshot(input.projectId);
      const state = structuredClone(latestSnapshot.state!);
      const key = records(state.keys).find(
        (candidate) => candidate.token === input.payload.token
      );
      if (!key) throw new Error("Local reference-sheet entity not found");
      const image = {
        asset_id: assetId,
        clip_id: randomUUID(),
        name: textValue(
          input.payload.name,
          textValue(key.name, String(key.token))
        ),
        status: "available",
        source: "upload",
        url: `mago-media://asset/${assetId}`,
        thumbnail_url: `mago-media://thumbnail/${assetId}`,
        created_at: nowIso(),
        description: null,
        has_description: false,
        description_source: null
      };
      key.images = [...records(key.images), image];
      key.selected_asset_id = assetId;
      key.effective_asset_id = assetId;
      key.effective_source = "upload";
      await this.snapshots.put({
        projectId: input.projectId,
        state: this.refreshReferences(state)
      });
      try {
        return await this.requestSheetDescription(
          input.projectId,
          String(key.token),
          assetId,
          false,
          false
        );
      } catch {
        return key;
      }
    }
    if (input.operation === "edit-image-description") {
      // PUT /assets/<id> {description}: a version's own text. Presence, not
      // truthiness — a cleared description reads as "described, and blank".
      const assetId = textValue(input.payload.assetId, "");
      const description = input.payload.description;
      if (typeof description !== "string")
        throw new Error("description must be a string");
      const state = structuredClone(snapshot.state!);
      const images = records(state.keys).flatMap((key) =>
        records(key.images).filter((image) => image.asset_id === assetId)
      );
      if (!images.length)
        throw new Error("Local reference-sheet image not found");
      for (const image of images) {
        image.description = description;
        image.has_description = true;
        image.description_source = "user";
      }
      await this.snapshots.put({ projectId: input.projectId, state });
      return { asset_id: assetId, description };
    }
    if (input.operation === "start-cloud-sheet-render")
      return this.startCloudSheetRender(input.projectId, input.payload);
    if (input.operation === "add-cloud-sheet-render")
      return this.addCloudSheetRender(input.projectId, input.payload);
    if (input.operation === "fail-cloud-sheet-render")
      return this.failCloudSheetRender(input.projectId, input.payload);
    if (input.operation === "pin-sheet") {
      const state = structuredClone(snapshot.state!);
      const key = records(state.keys).find(
        (candidate) => candidate.token === input.payload.token
      );
      if (!key) throw new Error("Local reference-sheet entity not found");
      const selected =
        typeof input.payload.selectedAssetId === "string"
          ? input.payload.selectedAssetId
          : null;
      if (
        selected &&
        !records(key.images).some((image) => image.asset_id === selected)
      ) {
        throw new Error("Local reference-sheet image not found");
      }
      key.selected_asset_id = selected;
      key.effective_asset_id =
        selected ??
        (records(key.images).at(-1)?.asset_id as string | undefined) ??
        null;
      key.effective_source =
        records(key.images).find(
          (image) => image.asset_id === key.effective_asset_id
        )?.source ?? null;
      await this.snapshots.put({
        projectId: input.projectId,
        state: this.refreshReferences(state)
      });
      return key;
    }
    if (input.operation === "add-shot") {
      const state = structuredClone(snapshot.state!);
      const shots = records(state.shots);
      if (!shots.length)
        throw new ShotEditError(
          "Cast a script into this project before adding shots",
          SHOT_EDIT_STATUS.conflict
        );
      validateAddedShot(input.payload, this.taggableTokens(state));
      const shotIndex =
        typeof input.payload.shot_index === "number"
          ? input.payload.shot_index
          : null;
      const { shot: added, order } = insertManualShot({
        shots,
        fields: input.payload,
        shotIndex,
        scriptVersion: snapshot.scriptVersions?.active_version ?? null
      });
      state.shots = shots;
      const refreshed = this.refreshReferences(state);
      const cut = structuredClone(
        snapshot.cut ?? { project_id: input.projectId, shots: [], export: null }
      );
      cut.shots = [...records(cut.shots), emptyCutShotEntry(added)];
      await this.snapshots.put({
        projectId: input.projectId,
        state: refreshed,
        cut
      });
      const addedState = records(refreshed.shots).find(
        (candidate) => candidate.timeline_id === added.timeline_id
      )!;
      return { ...shotReadView(addedState), shots: order };
    }
    if (input.operation === "edit-shot") {
      const state = structuredClone(snapshot.state!);
      const shots = records(state.shots);
      state.shots = shots;
      const shot = shots.find(
        (candidate) => candidate.timeline_id === input.payload.timelineId
      );
      if (!shot)
        throw new ShotEditError(
          "Shot not found in this project",
          SHOT_EDIT_STATUS.notFound
        );
      // The payload is the cloud's PATCH body, plus a local-only camera.
      const { timelineId: _timelineId, camera, ...fields } = input.payload;
      if (Object.keys(fields).length || camera === undefined)
        validateShotEdit(fields, {
          shot,
          taggableTokens: this.taggableTokens(state),
          hasRenders:
            records(
              records(snapshot.cut?.shots).find(
                (candidate) => candidate.timeline_id === shot.timeline_id
              )?.versions
            ).length > 0
        });
      const {
        shot_index: requestedShotIndex,
        hidden: requestedHidden,
        ...shotFields
      } = fields;
      if (Object.keys(shotFields).length) applyShotEdit(shot, shotFields);
      if (camera !== undefined) shot.camera = camera;
      const isShotMoved =
        requestedShotIndex !== null && requestedShotIndex !== undefined;
      const isShotHiddenChanged = "hidden" in fields;
      const order =
        isShotMoved || isShotHiddenChanged
          ? placeShot({
              shots,
              shot,
              shotIndex: isShotMoved ? Number(requestedShotIndex) : null,
              isShotHidden: isShotHiddenChanged ? !!requestedHidden : null
            })
          : null;
      const refreshed = this.refreshReferences(state);
      await this.snapshots.put({
        projectId: input.projectId,
        state: refreshed
      });
      const updated = records(refreshed.shots).find(
        (candidate) => candidate.timeline_id === shot.timeline_id
      )!;
      return {
        ...editedShotResponse(updated),
        ...(order ? { shots: order } : {}),
        camera: updated.camera ?? null
      };
    }
    const cut = structuredClone(
      snapshot.cut ?? {
        project_id: input.projectId,
        shots: [],
        missing: [],
        export: null
      }
    );
    // The cloud's shot-pin update, with the same refusals.
    if (!("selectedAssetId" in input.payload))
      throw new Error("selected_asset_id is required (null to clear the pin)");
    const selected = input.payload.selectedAssetId ?? null;
    if (selected !== null && typeof selected !== "string")
      throw new Error("selected_asset_id must be a string or null");
    const cutShot = records(cut.shots).find(
      (candidate) => candidate.timeline_id === input.payload.timelineId
    );
    if (
      !cutShot ||
      !records(snapshot.state?.shots).some(
        (shot) => shot.timeline_id === input.payload.timelineId
      )
    )
      throw new Error("Shot not found in this project");
    const pinError = shotPinError(cutShot, selected);
    if (pinError) throw new Error(pinError);
    cutShot.pinned_asset_id = selected;
    // Clearing the pin falls back to the newest finished render, so the cut
    // keeps playing the shot rather than leaving a hole.
    resolveCutShot(cutShot);
    cut.missing = records(cut.shots)
      .filter((shot) => !shot.asset_id)
      .map((shot) => Number(shot.sequence_id));
    const existingExport = record(cut.export);
    if (existingExport) existingExport.stale = true;
    await this.snapshots.put({ projectId: input.projectId, cut });
    return {
      timeline_id: input.payload.timelineId,
      pinned_asset_id: selected
    };
  }

  private async tryDescribeEntityImage(
    sourcePath: string,
    kind: string
  ): Promise<string | null> {
    if (!this.describeEntityImage) return null;
    try {
      const description = (
        await this.describeEntityImage(sourcePath, kind)
      ).trim();
      return description || null;
    } catch {
      // A caption improves a later MiniMax prompt, but must never turn an
      // otherwise successful image render/upload into a failure.
      return null;
    }
  }

  private async describeSheetVersion(
    projectId: string,
    token: string,
    requestedAssetId?: string,
    overwrite = false,
    required = false
  ): Promise<JsonRecord> {
    const snapshot = await this.requireSnapshot(projectId);
    const key = records(snapshot.state?.keys).find(
      (candidate) => candidate.token === token
    );
    if (!key) throw new Error("Local reference-sheet entity not found");
    const assetId = requestedAssetId ?? textValue(key.effective_asset_id, "");
    const image = records(key.images).find(
      (candidate) => candidate.asset_id === assetId
    );
    if (!image) throw new Error("This entity has no image to describe yet");
    if (hasOwnSheetDescription(key, image) && !overwrite) return key;

    const sourcePath =
      (await this.snapshots.resolveMediaPath(assetId)) ??
      (await this.projects.resolveMediaPath("asset", assetId));
    const description = sourcePath
      ? await this.tryDescribeEntityImage(sourcePath, textValue(key.kind, ""))
      : null;
    if (!description) {
      if (required) throw new Error("Could not describe this image");
      return key;
    }

    // Re-read after the VLM call. A user edit that landed while it was running
    // wins unless this was an explicit overwrite request.
    const latest = await this.requireSnapshot(projectId);
    const state = structuredClone(latest.state!);
    const latestKey = records(state.keys).find(
      (candidate) => candidate.token === token
    );
    const latestImage = records(latestKey?.images).find(
      (candidate) => candidate.asset_id === assetId
    );
    if (!latestKey || !latestImage)
      throw new Error("Local reference-sheet image not found");
    if (hasOwnSheetDescription(latestKey, latestImage) && !overwrite)
      return latestKey;
    latestImage.description = description;
    latestImage.has_description = true;
    latestImage.description_source = "vlm";
    const refreshed = this.refreshReferences(state);
    await this.snapshots.put({ projectId, state: refreshed });
    return (
      records(refreshed.keys).find((candidate) => candidate.token === token) ??
      latestKey
    );
  }

  private requestSheetDescription(
    projectId: string,
    token: string,
    assetId: string | undefined,
    overwrite: boolean,
    required: boolean
  ): Promise<JsonRecord> {
    const id = assetId ?? "effective";
    const pendingKey = `${projectId}:${token}:${id}`;
    const previous = this.pendingDescriptions.get(pendingKey);
    const run = (async () => {
      if (previous) {
        const result = await previous;
        if (!overwrite && !required) return result;
      }
      return this.describeSheetVersion(
        projectId,
        token,
        assetId,
        overwrite,
        required
      );
    })();
    this.pendingDescriptions.set(pendingKey, run);
    const cleanup = () => {
      if (this.pendingDescriptions.get(pendingKey) === run) {
        this.pendingDescriptions.delete(pendingKey);
      }
    };
    void run.then(cleanup, cleanup);
    return run;
  }

  private async ensureReferenceDescriptions(
    projectId: string,
    references: JsonRecord[]
  ): Promise<void> {
    for (const reference of references) {
      const token = textValue(reference.token, "");
      const assetId = textValue(reference.asset_id, "");
      if (!token || !assetId) continue;
      try {
        await this.requestSheetDescription(
          projectId,
          token,
          assetId,
          false,
          false
        );
      } catch {
        // Keep the casting description as the degraded fallback.
      }
    }
  }

  private generateStoryboard(
    projectId: string,
    payload: JsonRecord
  ): Promise<JsonRecord> {
    const requestId = `${projectId}:${String(payload.timelineId)}`;
    if (this.storyboardRequests.has(requestId))
      return Promise.reject(new Error("Storyboard is already generating"));
    this.storyboardRequests.add(requestId);
    const previous =
      this.storyboardPreparation.get(projectId) ?? Promise.resolve();
    const result = previous
      .catch(() => undefined)
      .then(async () => {
        await this.getSnapshot(projectId);
        const snapshot = await this.requireSnapshot(projectId);
        const shot = records(snapshot.state?.shots).find(
          (item) => item.timeline_id === payload.timelineId
        );
        if (!shot) throw new Error("Scene not found");
        if (shot.locked) throw new Error("Scene is locked");
        const keys = records(snapshot.state?.keys);
        if (
          storyboardState(shot, keys, Object.values(snapshot.planDetails ?? {}))
            .status === "generating"
        )
          throw new Error("Storyboard is already generating");
        const count = sceneCuts(shot.video_prompt).cuts.length;
        const project = await this.projects.get(projectId);
        const savedSize =
          record(project?.settings)?.output_size ?? snapshot.state?.output_size;
        const size = Array.isArray(savedSize) ? savedSize : [720, 1280];
        const bytes = templatePng(count, size);
        const template = await this.snapshots.storeGeneratedMedia(
          projectId,
          bytes,
          "png",
          false
        );
        const token = storyboardToken(String(shot.timeline_id));
        const prompt = buildStoryboardPrompt(shot, keys, size);
        await this.withProjectStateWrite(projectId, async () => {
          const latest = await this.requireSnapshot(projectId);
          const state = structuredClone(latest.state!);
          const oldKey = records(state.keys).find((key) => key.token === token);
          const board = {
            ...oldKey,
            layer_id: oldKey?.layer_id ?? randomUUID(),
            token,
            name: "Storyboard",
            role: "storyboard",
            timeline_id: shot.timeline_id,
            enabled: true,
            selected_asset_id: null,
            images: records(oldKey?.images),
            prompt,
            reference_asset_ids: [template.id],
            storyboard_scene_fingerprint: sceneFingerprint(shot, keys),
            panel_count: count
          };
          state.keys = [
            ...records(state.keys).filter((key) => key.token !== token),
            board
          ];
          await this.snapshots.put({ projectId, state });
        });
        const result = await this.generateSheetsInternal({
          projectId,
          isDryRun: false,
          tokens: [token],
          outputSize: [1536, 864],
          settings: {
            render_model:
              payload.renderModel ??
              record(project?.settings)?.storyboard_render_model ??
              "qwen_image_2512_local"
          }
        });
        return {
          timeline_id: shot.timeline_id,
          asset_id: null,
          clip_id: null,
          plan_id: result.plan_id
        };
      })
      .finally(() => {
        this.storyboardRequests.delete(requestId);
        if (this.storyboardPreparation.get(projectId) === result)
          this.storyboardPreparation.delete(projectId);
      });
    this.storyboardPreparation.set(projectId, result);
    return result;
  }

  private async readOrUpdateStoryboard(
    projectId: string,
    payload: JsonRecord,
    shouldUpdate: boolean
  ): Promise<JsonRecord> {
    const snapshot = await this.requireSnapshot(projectId);
    const state = structuredClone(snapshot.state!);
    const shot = records(state.shots).find(
      (item) => item.timeline_id === payload.timelineId
    );
    if (!shot) throw new Error("Scene not found");
    if (shouldUpdate) {
      if (shot.locked) throw new Error("Scene is locked");
      let key = records(state.keys).find(
        (item) => isStoryboard(item) && item.timeline_id === shot.timeline_id
      );
      if (
        "selected_asset_id" in payload &&
        payload.selected_asset_id !== null &&
        (typeof payload.selected_asset_id !== "string" ||
          !records(key?.images).some(
            (image) =>
              image.asset_id === payload.selected_asset_id &&
              ["available", "finished"].includes(String(image.status))
          ))
      )
        throw new Error("Storyboard version not found");
      if ("enabled" in payload && typeof payload.enabled !== "boolean")
        throw new Error("enabled must be a boolean");
      if (!key) {
        if (!("enabled" in payload)) throw new Error("Storyboard not found");
        key = {
          layer_id: randomUUID(),
          token: storyboardToken(String(shot.timeline_id)),
          timeline_id: shot.timeline_id,
          role: "storyboard",
          name: "Storyboard",
          images: []
        };
        state.keys = [...records(state.keys), key];
      }
      if ("selected_asset_id" in payload)
        key.selected_asset_id = payload.selected_asset_id;
      if ("enabled" in payload) key.enabled = payload.enabled;
      key.effective_asset_id = storyboardState(
        shot,
        records(state.keys)
      ).effective_asset_id;
      await this.snapshots.put({ projectId, state });
    }
    return {
      timeline_id: shot.timeline_id,
      storyboard: storyboardState(
        shot,
        records(state.keys),
        Object.values(snapshot.planDetails ?? {}),
        true
      )
    };
  }

  private async generateSheetsInternal(
    input: LocalScriptSheetsInput
  ): Promise<JsonRecord> {
    await this.assertLocalProject(input.projectId);
    const snapshot = await this.requireSnapshot(input.projectId);
    const ensured = ensureDesignMasterKeys(records(snapshot.state?.keys));
    const createdSheetGroup = createRequestedSheetGroup({
      existingKeys: ensured.keys,
      requestedTokens: input.tokens,
      sheetGroupToCreate: input.sheetGroupToCreate,
      prompt: input.settings?.prompt
    });
    const allKeys = createdSheetGroup
      ? [...ensured.keys, createdSheetGroup]
      : ensured.keys;
    if (ensured.addedTokens.length) {
      const state = structuredClone(snapshot.state!);
      state.keys = ensured.keys;
      await this.snapshots.put({
        projectId: input.projectId,
        state: this.refreshReferences(state)
      });
    }
    const requestedKeys = allKeys.filter((key) =>
      input.tokens?.length
        ? input.tokens.includes(String(key.token))
        : !isStoryboard(key)
    );
    const selectedTokens = new Set(
      requestedKeys.map((key) => textValue(key.token, ""))
    );
    for (const variant of requestedKeys.filter(isDesignVariant)) {
      const masterToken = designMasterToken(variant);
      const master = allKeys.find((key) => key.token === masterToken);
      if (
        masterToken &&
        master &&
        master.enabled !== false &&
        typeof master.effective_asset_id !== "string"
      ) {
        selectedTokens.add(masterToken);
      }
    }
    const runKeys = allKeys
      .filter((key) => selectedTokens.has(textValue(key.token, "")))
      .sort((left, right) => {
        const dependencyOrder =
          Number(isDesignVariant(left)) - Number(isDesignVariant(right));
        return (
          dependencyOrder ||
          textValue(left.token, "").localeCompare(textValue(right.token, ""))
        );
      });
    const requestedModel = textValue(input.settings?.render_model, "");
    const isCloudRender = CLOUD_SHEET_RENDER_MODELS.has(requestedModel);
    // A cloud model's spec names the text-to-image model even when it renders
    // through its edit sibling, as the backend's sheet render spec does.
    const selectedImageModel = isCloudRender
      ? requestedModel
      : resolveLocalScriptImageModel(input.settings?.render_model);
    const referenceFields =
      input.referenceAssetIds !== undefined ||
      input.referenceInstruction !== undefined
        ? {
            ...(input.referenceAssetIds !== undefined
              ? { reference_asset_ids: input.referenceAssetIds }
              : {}),
            ...(input.referenceInstruction !== undefined
              ? { reference_instruction: input.referenceInstruction }
              : {})
          }
        : undefined;
    const isStoryboardRun = runKeys.length > 0 && runKeys.every(isStoryboard);
    const run = isStoryboardRun
      ? {
          planned: runKeys.map((key) => {
            const spec = {
              kind: "storyboard",
              token: key.token,
              render_model: selectedImageModel,
              output_size: [1536, 864],
              storyboard_scene_fingerprint: key.storyboard_scene_fingerprint,
              panel_count: key.panel_count,
              attempt: randomUUID()
            };
            return {
              key,
              prompt: String(key.prompt),
              referenceAssetIds: strings(key.reference_asset_ids),
              spec,
              fingerprint: fingerprint(spec)
            };
          }),
          requestedReferences: null,
          preview: {
            would_run: runKeys.map((key) => key.token),
            skipped: [],
            blocked: [],
            changed: {}
          }
        }
      : planSheetRun({
          keys: runKeys,
          request: {
            renderModel: selectedImageModel,
            outputSize: input.outputSize,
            tokens: input.tokens,
            promptOverride:
              typeof input.settings?.prompt === "string"
                ? input.settings.prompt
                : undefined,
            referenceFields
          },
          inFlight: sheetSpecsInFlight(
            Object.values(snapshot.planDetails ?? {}).filter(
              (plan) => plan.local_operation === "sheets"
            )
          ),
          visualStyle: textValue(snapshot.state?.visual_style, ""),
          masterFor: (key) => {
            const masterToken = designMasterToken(key);
            if (!masterToken) return null;
            const master = allKeys.find(
              (candidate) => candidate.token === masterToken
            );
            return {
              token: masterToken,
              assetId: textValue(master?.effective_asset_id, "") || null
            };
          }
        });
    if (run.requestedReferences?.reference_asset_ids)
      await this.assertReferenceImagesExist(
        run.requestedReferences.reference_asset_ids
      );
    const answer = run.preview;
    if (input.isDryRun) return answer;
    if (run.requestedReferences !== null && !createdSheetGroup) {
      // Saved even when the key is skipped: sending references stores them.
      await this.saveSheetReferences(
        input.projectId,
        String(input.tokens?.[0]),
        run.requestedReferences
      );
    }
    if (!run.planned.length) return { ...answer, plan_id: null };
    const visualStyle = isStoryboardRun
      ? ""
      : textValue(snapshot.state?.visual_style, "");
    const keys: JsonRecord[] = run.planned.map((planned) => ({
      ...planned.key,
      _local_prompt: planned.prompt,
      _local_cloud_prompt: designMasterToken(planned.key)
        ? buildDesignVariantEditPrompt(planned.key, planned.prompt, visualStyle)
        : applyVisualStyle(planned.prompt, visualStyle),
      _local_render_prompt: isStoryboard(planned.key)
        ? planned.prompt
        : composeSheetRenderPrompt(
            planned.key,
            planned.prompt,
            visualStyle,
            planned.spec.output_size as unknown[]
          ),
      _local_reference_asset_ids: planned.referenceAssetIds,
      _local_spec: planned.spec,
      _local_fingerprint: planned.fingerprint
    }));
    const tokens = keys.map((key) => String(key.token));
    if (!isCloudRender && selectedImageModel !== "qwen_image_2512_local") {
      const setup =
        selectedImageModel === "flux2_klein_4b_q8_local"
          ? "flux2-klein-4b-q8"
          : "flux2-klein-9b-q8";
      const status = await probeComfyRenderModel(
        await this.getComfyEndpoint(),
        "qwen",
        { qwen_image_edit_setup: setup }
      );
      if (!status.ready)
        throw new Error(
          status.message ?? "The selected Flux 2 model is not ready"
        );
    }
    const isQueuedBehindActiveRun =
      (!isCloudRender || isStoryboardRun) &&
      this.projectRuns.has(input.projectId);
    if (!isQueuedBehindActiveRun) this.assertIdle(input.projectId);
    if (createdSheetGroup)
      await this.saveCreatedSheetGroup(input.projectId, {
        ...createdSheetGroup,
        ...(run.requestedReferences ?? {})
      });
    const planId = randomUUID();
    const steps = keys.flatMap((key, index) => [
      createStep(
        planId,
        input.projectId,
        index * 2,
        "submit_img2img_batch",
        undefined,
        { token: key.token, prompt: key.prompt }
      ),
      createStep(
        planId,
        input.projectId,
        index * 2 + 1,
        "poll_img2img_batch",
        undefined,
        { token: key.token }
      )
    ]);
    const plan = createPlan(
      planId,
      input.projectId,
      "Render local reference sheets",
      "sheets",
      { ...input, tokens, requested_tokens: input.tokens ?? [] },
      steps
    );
    plan.local_targets = keys;
    if (isCloudRender) {
      plan.name = "Render Mago Cloud reference sheets";
      plan.local_executor = CLOUD_SHEET_EXECUTOR;
    }
    await this.snapshots.putPlan(input.projectId, planId, plan);
    const supersededTokens = new Set(tokens);
    await this.supersedeResumablePlansHoldingItems(
      input.projectId,
      "sheets",
      planId,
      () => (step) =>
        supersededTokens.has(String(record(step.tool_args)?.token))
    );
    if (isCloudRender)
      this.waitForRenderer(input.projectId, planId, isStoryboardRun);
    else
      this.startOrQueueRun(input.projectId, planId, (control) =>
        this.renderSheets(input, keys, plan, control)
      );
    return { ...answer, plan_id: planId };
  }

  private async generateShotsInternal(
    input: LocalScriptShotsInput
  ): Promise<JsonRecord> {
    await this.assertLocalProject(input.projectId);
    const snapshot = await this.requireSnapshot(input.projectId);
    const run = planShotRun({
      shots: records(snapshot.state?.shots).map((shot) => ({
        ...shot,
        _local_storyboard: storyboardReference(
          shot,
          records(snapshot.state?.keys)
        )
      })),
      cutShots: records(snapshot.cut?.shots),
      request: {
        videoSettings: input.videoSettings,
        outputSize: input.outputSize,
        sequenceIds: input.sequenceIds,
        timelineIds: input.timelineIds,
        sequential: input.sequential,
        visualStyle: textValue(snapshot.state?.visual_style, "")
      },
      inFlight: shotSpecsInFlight(
        Object.values(snapshot.planDetails ?? {}).filter(
          (plan) => plan.local_operation === "shots"
        )
      )
    });
    const answer = run.preview;
    if (input.isDryRun) return answer;
    // Refused for the whole run rather than rendered without the offending
    // shots, as the cloud does: the length is one field the caller can fix.
    if (run.durationError) throw new ShotRunError(run.durationError);
    if (!run.planned.length) return { ...answer, plan_id: null };
    const runnable: JsonRecord[] = run.planned.map((planned) => ({
      ...planned.shot,
      _local_sequential: planned.sequential,
      _local_previous_timeline_id: planned.previousTimelineId,
      _local_previous_in_run: planned.previousInRun,
      _local_duration_s: planned.durationSeconds,
      _local_prompt_rewrite: planned.promptRewrite,
      _local_render_spec: planned.renderSpec
    }));
    this.assertIdle(input.projectId);
    const planId = randomUUID();
    let order = 0;
    const steps: JsonRecord[] = [];
    for (const shot of runnable) {
      const timelineId = String(shot.timeline_id);
      const sequential = record(shot._local_sequential);
      if (sequential && shot._local_previous_in_run === true) {
        steps.push(
          createStep(
            planId,
            input.projectId,
            order++,
            "poll_prev_shot_complete",
            timelineId,
            { prev_timeline_id: shot._local_previous_timeline_id }
          )
        );
      }
      steps.push(
        createStep(planId, input.projectId, order++, "shot_context", timelineId)
      );
      if (sequential?.mode === "key_frames") {
        steps.push(
          createStep(
            planId,
            input.projectId,
            order++,
            "submit_pick_keyframes",
            timelineId
          ),
          createStep(
            planId,
            input.projectId,
            order++,
            "poll_pick_keyframes",
            timelineId
          )
        );
      } else if (sequential?.mode === "last_chunk") {
        steps.push(
          createStep(
            planId,
            input.projectId,
            order++,
            "shot_video_source",
            timelineId
          )
        );
      } else if (sequential) {
        steps.push(
          createStep(
            planId,
            input.projectId,
            order++,
            "use_provided_reference_frame",
            timelineId
          )
        );
      }
      const referenceCount = Object.values(
        record(shot.references) ?? {}
      ).flatMap((value) => records(value)).length;
      const referenceLimit = referenceImageSlotBudget(
        sequential,
        !!record(shot._local_storyboard)
      );
      if (referenceCount > referenceLimit) {
        steps.push(
          createStep(
            planId,
            input.projectId,
            order++,
            "submit_stitch_refs",
            timelineId
          ),
          createStep(
            planId,
            input.projectId,
            order++,
            "poll_stitch_refs",
            timelineId
          )
        );
      }
      for (const tool of [
        ...(shot._local_prompt_rewrite === "raw"
          ? []
          : ["submit_shot_video_prompt", "poll_shot_video_prompt"]),
        "create_render_layer",
        "submit_video_render",
        "poll_video_render"
      ]) {
        steps.push(
          createStep(planId, input.projectId, order++, tool, timelineId)
        );
      }
    }
    const plan = createPlan(
      planId,
      input.projectId,
      "Render local MiniMax H3 shots",
      "shots",
      input as unknown as JsonRecord,
      steps
    );
    plan.local_targets = runnable;
    // `last_spec` is what the user last asked for, so the next dry run can say
    // what changed since; whether it rendered is the version's fingerprint.
    const lastSpecs = new Map(
      run.planned.map((planned) => [
        String(planned.shot.timeline_id),
        planned.renderSpec.spec
      ])
    );
    await this.snapshots.put({
      projectId: input.projectId,
      state: {
        ...snapshot.state,
        shots: records(snapshot.state?.shots).map((shot) =>
          lastSpecs.has(String(shot.timeline_id))
            ? { ...shot, last_spec: lastSpecs.get(String(shot.timeline_id)) }
            : shot
        )
      }
    });
    await this.snapshots.putPlan(input.projectId, planId, plan);
    const supersededTimelineIds = new Set(lastSpecs.keys());
    await this.supersedeResumablePlansHoldingItems(
      input.projectId,
      "shots",
      planId,
      (supersededPlan) => {
        const supersededTimelineIdsWithDependents =
          withUnfinishedSequentialDependents({
            planSteps: records(supersededPlan.steps),
            supersededTimelineIds
          });
        return (step) =>
          supersededTimelineIdsWithDependents.has(String(step.timeline_id));
      }
    );
    this.startRun(input.projectId, planId, (control) =>
      this.renderShots(input, runnable, plan, control)
    );
    return { ...answer, plan_id: planId };
  }

  private async renderSheets(
    input: LocalScriptSheetsInput,
    targetKeys: JsonRecord[],
    basePlan: JsonRecord,
    control: RunControl
  ): Promise<void> {
    const planId = String(basePlan.id);
    let plan = planAt(basePlan, "RUNNING");
    await this.snapshots.putPlan(input.projectId, planId, plan);
    let activeStep: JsonRecord | undefined;
    try {
      const client = new ComfyScriptProjectClient(
        await this.getComfyEndpoint()
      );
      const initialSnapshot = await this.requireSnapshot(input.projectId);
      const visualStyle = textValue(initialSnapshot.state?.visual_style, "");
      const imageModel = resolveLocalScriptImageModel(
        input.settings?.render_model
      );
      const explicitlyRequestedTokens = strings(
        record(basePlan.local_request)?.requested_tokens
      );
      for (const target of targetKeys) {
        this.throwIfCancelled(control);
        const token = String(target.token);
        const poll = this.findStep(
          plan,
          "poll_img2img_batch",
          undefined,
          token
        );
        if (completedStep(poll)) continue;
        activeStep = this.findStep(
          plan,
          "submit_img2img_batch",
          undefined,
          token
        );
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "RUNNING"
        );
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "COMPLETED",
          {
            token,
            submitted: true
          }
        );
        activeStep = this.findStep(
          plan,
          "poll_img2img_batch",
          undefined,
          token
        );
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "RUNNING"
        );
        // The planned prompt (sheet_prompt, with the reference instruction
        // when it renders from references); plans made before the planner
        // existed carry none and fall back to the key's own text.
        const requestedPrompt = textValue(
          target._local_prompt,
          textValue(
            explicitlyRequestedTokens.includes(token)
              ? input.settings?.prompt
              : undefined,
            textValue(
              target.prompt,
              textValue(
                target.description,
                textValue(target.name, String(target.token))
              )
            )
          )
        );
        const masterToken = designMasterToken(target);
        let masterAssetId: string | null = null;
        const renderPrompt = textValue(
          target._local_render_prompt,
          composeSheetRenderPrompt(
            target,
            requestedPrompt,
            visualStyle,
            input.outputSize
          )
        );
        if (masterToken) {
          const current = await this.requireSnapshot(input.projectId);
          const master = records(current.state?.keys).find(
            (key) => key.token === masterToken
          );
          masterAssetId = textValue(master?.effective_asset_id, "") || null;
          if (!masterAssetId) {
            throw new Error(
              `Render the master design ${masterToken} before its variants`
            );
          }
        }
        // A key with references renders through its model's edit flavour,
        // the master design (for a variant) first, as the backend
        // puts the first reference in as the source.
        const sourceIds = [
          ...(masterAssetId ? [masterAssetId] : []),
          ...strings(target._local_reference_asset_ids)
        ].filter((id, index, ids) => ids.indexOf(id) === index);
        const sourcePaths = await Promise.all(
          sourceIds.map(async (id) => {
            const resolved =
              (await this.snapshots.resolveMediaPath(id)) ??
              (await this.projects.resolveMediaPath("asset", id));
            if (!resolved)
              throw new Error(
                masterToken && id === masterAssetId
                  ? `The master design image for ${masterToken} is unavailable locally`
                  : `Reference image ${id} is unavailable locally`
              );
            return resolved;
          })
        );
        const frame = isStoryboard(target)
          ? [1536, 864]
          : sheetOutputSize(target.kind, input.outputSize ?? []);
        const bytes = sourcePaths.length
          ? await client.runImageEdit({
              sourcePath: sourcePaths[0]!,
              ...(Number(frame[0]) > 0 && Number(frame[1]) > 0
                ? {
                    outputSize: [Number(frame[0]), Number(frame[1])] as [
                      number,
                      number
                    ]
                  }
                : {}),
              referencePaths: sourcePaths.slice(1),
              prompt: renderPrompt,
              model: imageModel,
              isCancelled: () => control.cancelled
            })
          : await client.runImage({
              prompt: renderPrompt,
              model: imageModel,
              width: Number(frame[0]) || undefined,
              height: Number(frame[1]) || undefined,
              isCancelled: () => control.cancelled
            });
        // What this image actually rendered from: a variant whose master
        // re-rendered earlier in this run edits the new master image.
        const plannedSpec = record(target._local_spec);
        const renderedSpec = plannedSpec
          ? {
              ...plannedSpec,
              ...(masterAssetId ? { master_asset_id: masterAssetId } : {})
            }
          : null;
        this.throwIfCancelled(control);
        const media = await this.snapshots.storeGeneratedMedia(
          input.projectId,
          bytes,
          "png",
          !isStoryboard(target) &&
            records(plan.steps).filter(
              (step) =>
                step.tool_name === "poll_img2img_batch" &&
                step.status === "COMPLETED"
            ).length === 0
        );
        await this.withProjectStateWrite(input.projectId, async () => {
          const snapshot = await this.requireSnapshot(input.projectId);
          const state = structuredClone(snapshot.state!);
          const key = records(state.keys).find(
            (candidate) => candidate.token === target.token
          );
          if (key) {
            const image = {
              asset_id: media.id,
              clip_id: randomUUID(),
              name:
                String(key.name ?? key.token) +
                " " +
                (records(key.images).length + 1),
              status: "available",
              source: "render",
              url: media.url,
              thumbnail_url: media.url,
              created_at: nowIso(),
              prompt: requestedPrompt,
              input_settings: {
                prompt: requestedPrompt,
                rendered_prompt: renderPrompt
              },
              // What the inputs panel shows: the cloud reads the same keys off
              // the img2img job's settings.
              render_settings: {
                prompt: renderPrompt,
                render_model: imageModel,
                width: frame[0] ?? null,
                height: frame[1] ?? null,
                ...(sourceIds.length ? { source_asset_id: sourceIds[0] } : {}),
                ...(sourceIds.length > 1
                  ? { reference_images: sourceIds.slice(1) }
                  : {})
              },
              // "Already rendered with these inputs" reads this back.
              fingerprint: renderedSpec ? fingerprint(renderedSpec) : null,
              ...(isStoryboard(target)
                ? {
                    storyboard_plan_id: planId,
                    storyboard_scene_fingerprint:
                      target.storyboard_scene_fingerprint,
                    panel_count: target.panel_count,
                    render_spec: renderedSpec
                  }
                : {}),
              description: null,
              has_description: false,
              description_source: null
            };
            key.images = [...records(key.images), image];
            if (renderedSpec) key.last_spec = renderedSpec;
            if (!isStoryboard(target)) key.selected_asset_id = media.id;
            key.effective_asset_id =
              isStoryboard(target) && typeof key.selected_asset_id === "string"
                ? key.selected_asset_id
                : media.id;
            key.effective_source = "render";
          }
          await this.snapshots.put({
            projectId: input.projectId,
            state: this.refreshReferences(state)
          });
        });
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "COMPLETED",
          {
            token,
            asset_ids: [media.id],
            output_url: media.url,
            ...(masterToken
              ? {
                  render_mode:
                    imageModel === "qwen_image_2512_local"
                      ? "qwen_image_edit"
                      : "flux2_klein_image_edit",
                  render_model: imageModel,
                  master_asset_id: masterAssetId
                }
              : {
                  render_mode:
                    imageModel === "qwen_image_2512_local"
                      ? "qwen_text_to_image"
                      : "flux2_klein_text_to_image",
                  render_model: imageModel
                })
          }
        );
      }
      const captionRequests: Array<Promise<JsonRecord>> = [];
      for (const step of records(plan.steps)) {
        if (
          step.tool_name !== "poll_img2img_batch" ||
          step.status !== "COMPLETED"
        ) {
          continue;
        }
        const token = textValue(record(step.tool_args)?.token, "");
        for (const assetId of strings(record(step.result)?.asset_ids)) {
          if (
            token &&
            assetId &&
            !targetKeys.some(
              (target) => target.token === token && isStoryboard(target)
            )
          ) {
            captionRequests.push(
              this.requestSheetDescription(
                input.projectId,
                token,
                assetId,
                false,
                false
              )
            );
          }
        }
      }
      await Promise.allSettled(captionRequests);
      await this.snapshots.putPlan(
        input.projectId,
        planId,
        planAt(plan, "COMPLETED")
      );
      void (async () => {
        for (const target of targetKeys) {
          if (
            target.kind !== "character" ||
            resolveBodyPlan(target.body_plan) ||
            resolveBodyPlan(target.body_plan_auto)
          )
            continue;
          const appearance = [
            target._local_prompt ?? target.prompt,
            target.seed_description
          ]
            .filter(Boolean)
            .join(" ");
          const bodyPlan = await classifyBodyPlan(appearance, async (prompt) =>
            stripQwenReasoning(await client.runVideoPrompt(prompt))
          );
          if (!bodyPlan) continue;
          const fresh = await this.requireSnapshot(input.projectId);
          const state = structuredClone(fresh.state!);
          const key = records(state.keys).find(
            (item) => item.token === target.token
          );
          if (!key || resolveBodyPlan(key.body_plan)) continue;
          key.body_plan_auto = bodyPlan;
          await this.snapshots.put({ projectId: input.projectId, state });
        }
      })().catch(() => undefined);
    } catch (error) {
      if (control.cancelled) return;
      const message =
        error instanceof Error ? error.message : "Local sheet rendering failed";
      if (activeStep)
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "FAILED",
          undefined,
          message
        );
      await this.snapshots.putPlan(
        input.projectId,
        planId,
        planAt(plan, "PAUSED", message)
      );
    }
  }

  private async renderShots(
    input: LocalScriptShotsInput,
    targetShots: JsonRecord[],
    basePlan: JsonRecord,
    control: RunControl
  ): Promise<void> {
    const planId = String(basePlan.id);
    const localH3Steps = resolveLocalH3Steps(
      input.videoSettings?.local_h3_steps
    );
    const useLegacyH3Workflow =
      input.videoSettings?.local_h3_legacy_workflow === true;
    const localH3TextEncoder = resolveLocalH3TextEncoder(
      input.videoSettings?.local_h3_text_encoder
    );
    const localH3Model = resolveLocalH3Model(
      input.videoSettings?.local_h3_model
    );
    const scriptTextModel = await this.getScriptTextModel();
    let plan = planAt(basePlan, "RUNNING");
    await this.snapshots.putPlan(input.projectId, planId, plan);
    let activeStep: JsonRecord | undefined;
    try {
      const client = new ComfyScriptProjectClient(
        await this.getComfyEndpoint(),
        scriptTextModel
      );
      for (const target of [...targetShots].sort(
        (left, right) => Number(left.shot_index) - Number(right.shot_index)
      )) {
        this.throwIfCancelled(control);
        const timelineId = String(target.timeline_id);
        if (completedStep(this.findStep(plan, "poll_video_render", timelineId)))
          continue;
        let snapshot = await this.requireSnapshot(input.projectId);
        const referenceItems = Object.values(
          record(target.references) ?? {}
        ).flatMap((value) => records(value));
        await this.ensureReferenceDescriptions(input.projectId, referenceItems);
        snapshot = await this.requireSnapshot(input.projectId);
        const stateKeys = new Map(
          records(snapshot.state?.keys).map((key) => [String(key.token), key])
        );
        const sequential = record(target._local_sequential);
        // The engine's image slots, one of them taken by an image-mode
        // continuity reference; over-budget groups are gridded rather than
        // dropped.
        const imageSlotBudget = referenceImageSlotBudget(
          sequential,
          !!record(target._local_storyboard)
        );
        const referenceSlots = planReferenceSlots(
          Object.fromEntries(
            GROUP_ORDER.map((group) => [
              group,
              records(record(target.references)?.[group])
                .map((entry) => textValue(entry.asset_id, ""))
                .filter(Boolean)
            ])
          ),
          imageSlotBudget
        );
        const resolveReferencePath = async (id: string) => {
          const resolved =
            (await this.snapshots.resolveMediaPath(id)) ??
            (await this.projects.resolveMediaPath("asset", id));
          if (!resolved)
            throw new Error("Local reference image " + id + " is unavailable");
          return resolved;
        };
        const hasOverflow = referenceSlots.some((slot) => slot.length > 1);
        // One asset per slot: a lone reference is itself, a gridded slot's
        // asset is created below. Filled in slot order.
        const referenceIds: string[] = referenceSlots.map((slot) =>
          slot.length === 1 ? slot[0]! : ""
        );
        const referencePaths: string[] = await Promise.all(
          referenceSlots.map((slot) =>
            slot.length === 1
              ? resolveReferencePath(slot[0]!)
              : Promise.resolve("")
          )
        );
        const frameRange = Array.isArray(input.videoSettings?.frame_range)
          ? input.videoSettings.frame_range
          : null;
        const durationSetting =
          typeof input.videoSettings?.duration_s === "number"
            ? input.videoSettings.duration_s
            : frameRange?.length === 2 &&
                typeof frameRange[0] === "number" &&
                typeof frameRange[1] === "number"
              ? (frameRange[1] - frameRange[0]) / 24
              : undefined;
        const durationSeconds =
          typeof target._local_duration_s === "number"
            ? target._local_duration_s
            : typeof target.duration_s === "number"
              ? target.duration_s
              : typeof durationSetting === "number"
                ? durationSetting
                : 5;
        if (hasOverflow) {
          const griddedIds = referenceSlots.filter((slot) => slot.length > 1);
          activeStep = this.findStep(plan, "submit_stitch_refs", timelineId);
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "RUNNING"
          );
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "COMPLETED",
            { asset_ids: griddedIds.flat() }
          );
          activeStep = this.findStep(plan, "poll_stitch_refs", timelineId);
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "RUNNING"
          );
          const grids: JsonRecord[] = [];
          for (const [index, slot] of referenceSlots.entries()) {
            if (slot.length < 2) continue;
            const grid = await this.snapshots.storeGeneratedMedia(
              input.projectId,
              await createReferenceGrid(
                await Promise.all(slot.map(resolveReferencePath))
              ),
              "png"
            );
            referenceIds[index] = grid.id;
            referencePaths[index] = grid.path;
            grids.push({
              asset_id: grid.id,
              output_url: grid.url,
              members: slot
            });
          }
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "COMPLETED",
            {
              asset_id: grids[0]?.asset_id ?? null,
              output_url: grids[0]?.output_url ?? null,
              members: griddedIds.flat(),
              grids
            }
          );
        }
        const board = record(target._local_storyboard);
        if (board && typeof board.asset_id === "string")
          referencePaths.push(await resolveReferencePath(board.asset_id));
        const numberedImageIds = [
          ...referenceIds,
          ...(board ? [String(board.asset_id)] : [])
        ];
        // The previous shot's reference, when this shot continues from one:
        // its own slot, appended last so it takes the highest tag.
        let continuityImage: {
          id: string;
          description: string;
          continuation: Continuation | null;
        } | null = null;
        let openingFramePath: string | undefined;
        let continuityVideo: { id: string; description: string } | null = null;
        const referenceVideos: Array<{
          path: string;
          skipFrames: number;
          frameCount: number;
        }> = [];
        let continuesFrom: JsonRecord | null = null;

        const barrier = this.findStep(
          plan,
          "poll_prev_shot_complete",
          timelineId
        );
        if (barrier && !completedStep(barrier)) {
          activeStep = barrier;
          plan = await this.setStep(
            input.projectId,
            planId,
            barrier,
            "RUNNING"
          );
          plan = await this.setStep(
            input.projectId,
            planId,
            barrier,
            "COMPLETED",
            {
              prev_timeline_id: target._local_previous_timeline_id
            }
          );
        }

        activeStep = this.findStep(plan, "shot_context", timelineId);
        if (!completedStep(activeStep)) {
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "RUNNING"
          );
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "COMPLETED",
            {
              reference_image_ids: referenceIds,
              raw_video_prompt: target.video_prompt
            }
          );
        }

        if (sequential) {
          const previousId = String(target._local_previous_timeline_id);
          const latest = await this.requireSnapshot(input.projectId);
          const previousCut = records(latest.cut?.shots).find(
            (shot) => shot.timeline_id === previousId
          );
          const previousAssetId =
            typeof previousCut?.asset_id === "string"
              ? previousCut.asset_id
              : "";
          const previousPath = previousAssetId
            ? await this.snapshots.resolveMediaPath(previousAssetId)
            : null;
          if (!previousPath)
            throw new Error("The preceding shot render is unavailable locally");
          const appendix = textValue(
            sequential.prompt_appendix,
            SEQUENTIAL_SHOT_REFERENCE_DESCRIPTION
          );
          if (sequential.mode === "last_chunk") {
            activeStep = this.findStep(plan, "shot_video_source", timelineId);
            const previousStateShot = records(latest.state?.shots).find(
              (shot) => shot.timeline_id === previousId
            );
            const previousDuration =
              typeof previousStateShot?.duration_s === "number"
                ? previousStateShot.duration_s
                : durationSeconds;
            const seconds =
              typeof sequential.chunk_seconds === "number"
                ? sequential.chunk_seconds
                : 2;
            const frameCount = Math.max(5, Math.round(seconds * 24));
            referenceVideos.push({
              path: previousPath,
              skipFrames: Math.max(
                0,
                Math.round(previousDuration * 24) - frameCount
              ),
              frameCount
            });
            continuityVideo = { id: previousAssetId, description: appendix };
            continuesFrom = {
              timeline_id: previousId,
              asset_id: previousAssetId,
              mode: "last_chunk",
              reference_asset_id: previousAssetId
            };
            if (!completedStep(activeStep)) {
              plan = await this.setStep(
                input.projectId,
                planId,
                activeStep,
                "RUNNING"
              );
              plan = await this.setStep(
                input.projectId,
                planId,
                activeStep,
                "COMPLETED",
                {
                  source_asset_id: previousAssetId,
                  mode: "last_chunk",
                  frame_count: frameCount
                }
              );
            }
          } else {
            const isGrid = sequential.mode === "key_frames";
            const submitKeyframes = this.findStep(
              plan,
              isGrid ? "submit_pick_keyframes" : "use_provided_reference_frame",
              timelineId
            );
            activeStep = submitKeyframes;
            if (isGrid) {
              plan = await this.setStep(
                input.projectId,
                planId,
                submitKeyframes,
                "RUNNING"
              );
              plan = await this.setStep(
                input.projectId,
                planId,
                submitKeyframes,
                "COMPLETED",
                {
                  video_asset_id: previousAssetId,
                  candidates: 4
                }
              );
              activeStep = this.findStep(
                plan,
                "poll_pick_keyframes",
                timelineId
              );
              plan = await this.setStep(
                input.projectId,
                planId,
                activeStep,
                "RUNNING"
              );
            } else {
              plan = await this.setStep(
                input.projectId,
                planId,
                activeStep,
                "RUNNING"
              );
            }
            const frame = isGrid
              ? await extractKeyframeGrid(
                  previousPath,
                  durationSeconds,
                  typeof sequential.num_select === "number"
                    ? sequential.num_select
                    : 1
                )
              : await extractLastFrame(previousPath);
            const continuity = await this.snapshots.storeGeneratedMedia(
              input.projectId,
              frame,
              "png"
            );
            referencePaths.push(continuity.path);
            numberedImageIds.push(continuity.id);
            const continuation = sequentialContinuation(sequential);
            continuityImage = {
              id: continuity.id,
              description: appendix,
              continuation
            };
            if (continuation === "pin") openingFramePath = continuity.path;
            plan = await this.setStep(
              input.projectId,
              planId,
              activeStep,
              "COMPLETED",
              {
                shot_reference_image_id: continuity.id,
                output_url: continuity.url,
                mode: sequential.mode
              }
            );
            continuesFrom = {
              timeline_id: previousId,
              asset_id: previousAssetId,
              mode: sequential.mode,
              reference_asset_id: continuity.id
            };
          }
        }

        let adaptedPrompt: string | undefined;
        const promptPoll = this.findStep(
          plan,
          "poll_shot_video_prompt",
          timelineId
        );
        if (target._local_prompt_rewrite === "raw") {
          // prompt_rewrite "raw": the shot's own prompt goes to the model as is.
          adaptedPrompt = sequential
            ? shotPromptWithSequentialAppendix(
                textValue(target.video_prompt, ""),
                textValue(sequential.prompt_appendix, "")
              )
            : textValue(target.video_prompt, "");
          adaptedPrompt = applyVisualStyle(
            adaptedPrompt,
            record(record(record(target._local_render_spec)?.spec)?.settings)
              ?.visual_style
          );
        } else if (completedStep(promptPoll)) {
          adaptedPrompt = textValue(
            record(promptPoll?.result)?.adapted_video_prompt,
            ""
          );
        } else {
          activeStep = this.findStep(
            plan,
            "submit_shot_video_prompt",
            timelineId
          );
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "RUNNING"
          );
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "COMPLETED",
            {
              job_id: `${planId}:${timelineId}`,
              reference_image_ids: numberedImageIds
            }
          );
          activeStep = this.findStep(
            plan,
            "poll_shot_video_prompt",
            timelineId
          );
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "RUNNING"
          );
          const body = buildShotVideoPromptBody({
            shot: target,
            keys: [...stateKeys.values()],
            referenceSlots,
            imageAssetIds: referenceIds,
            continuityImage,
            continuityVideo,
            durationSeconds,
            outputSize: input.outputSize,
            visualStyle: textValue(
              record(record(record(target._local_render_spec)?.spec)?.settings)
                ?.visual_style,
              ""
            )
          });
          const cloud = await this.runCloudTextModel(
            "video-prompt",
            {
              ...body,
              prompt_version: "minimax_h3_ref"
            },
            () => control.cancelled
          );
          const composed =
            cloud ??
            (await generateVideoPrompt(
              body,
              createQwenVideoPromptCall((prompt) =>
                client.runVideoPrompt(prompt, () => control.cancelled)
              ),
              { storedCaption: storedCaptionFor([...stateKeys.values()]) }
            ));
          this.throwIfCancelled(control);
          adaptedPrompt = textValue(composed.prompt, "");
          if (!adaptedPrompt)
            throw new Error("Video prompt returned no prompt");
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "COMPLETED",
            {
              adapted_video_prompt: adaptedPrompt,
              prompt_template: composed.prompt_template,
              model: cloud
                ? "cloud"
                : LOCAL_SCRIPT_TEXT_MODEL_FILES[scriptTextModel],
              text_model_route: cloud ? "cloud" : "local",
              numbered_ref_asset_ids: numberedImageIds,
              numbered_video_asset_ids: continuityVideo
                ? [continuityVideo.id]
                : [],
              speakers: composed.speakers,
              warnings: composed.warnings,
              fallback: composed.fallback
            }
          );
        }

        activeStep = this.findStep(plan, "create_render_layer", timelineId);
        const layerId = textValue(
          record(activeStep?.result)?.layer_id,
          randomUUID()
        );
        if (!completedStep(activeStep)) {
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "RUNNING"
          );
          plan = await this.setStep(
            input.projectId,
            planId,
            activeStep,
            "COMPLETED",
            {
              layer_id: layerId
            }
          );
        }
        activeStep = this.findStep(plan, "submit_video_render", timelineId);
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "RUNNING"
        );
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "COMPLETED",
          {
            submitted: true,
            prompt: adaptedPrompt,
            local_h3_steps: localH3Steps,
            local_h3_legacy_workflow: useLegacyH3Workflow,
            local_h3_text_encoder: localH3TextEncoder,
            local_h3_model: localH3Model
          }
        );
        activeStep = this.findStep(plan, "poll_video_render", timelineId);
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "RUNNING"
        );
        // Deduped by asset, first position kept, as the composer numbered
        // them: a repeated image would shift every later <Picture n>.
        const renderedPaths = referencePaths.filter(
          (_path, index) =>
            numberedImageIds.indexOf(numberedImageIds[index]!) === index
        );
        const bytes = await client.runVideo({
          prompt: adaptedPrompt,
          referencePaths: renderedPaths,
          referenceVideos,
          width: input.outputSize?.[0],
          height: input.outputSize?.[1],
          durationSeconds,
          steps: localH3Steps,
          useLegacyWorkflow: useLegacyH3Workflow,
          textEncoder: localH3TextEncoder,
          videoModel: localH3Model,
          openingFramePath,
          isCancelled: () => control.cancelled
        });
        this.throwIfCancelled(control);
        const media = await this.snapshots.storeGeneratedMedia(
          input.projectId,
          bytes,
          "mp4"
        );
        const posterBytes = await extractFirstFrame(media.path);
        const poster = await this.snapshots.storeGeneratedMedia(
          input.projectId,
          posterBytes,
          "png"
        );
        const refreshed = await this.requireSnapshot(input.projectId);
        const cut = structuredClone(
          refreshed.cut ?? {
            project_id: input.projectId,
            shots: [],
            missing: [],
            export: null
          }
        );
        const cutShot = records(cut.shots).find(
          (shot) => shot.timeline_id === target.timeline_id
        );
        if (cutShot) {
          const renderSpecEnvelope = record(target._local_render_spec);
          const renderSpec = record(renderSpecEnvelope?.spec);
          const version = {
            layer_id: layerId,
            asset_id: media.id,
            name:
              textValue(target.heading, "Shot") +
              " " +
              (records(cutShot.versions).length + 1),
            ready: true,
            status: "available",
            sent_prompt: adaptedPrompt ?? null,
            url: media.url,
            poster_url: poster.url,
            created_at: nowIso(),
            upscale_of: null,
            continues_from: continuesFrom,
            metrics_input: {
              prompt: adaptedPrompt,
              duration_s: durationSeconds,
              reference_asset_ids: [...new Set(numberedImageIds)]
            },
            render_spec: renderSpec,
            input_settings: {
              duration_s: durationSeconds,
              output_size: input.outputSize ?? null,
              prompt_rewrite: target._local_prompt_rewrite ?? null,
              _local_render_spec: renderSpec
            },
            prompt_rewrite: target._local_prompt_rewrite ?? null,
            size: input.outputSize ?? null,
            // What this version rendered from; "already rendered with these
            // inputs" reads it back once the version has finished.
            fingerprint: renderSpecEnvelope?.fingerprint ?? null
          };
          cutShot.versions = [...records(cutShot.versions), version];
          // Every render wins the pin, except on
          // a locked shot, which keeps its approved one.
          const isLocked =
            records(refreshed.state?.shots).find(
              (shot) => shot.timeline_id === target.timeline_id
            )?.locked === true;
          if (!isLocked) cutShot.pinned_asset_id = media.id;
          resolveCutShot(cutShot);
        }
        const existingExport = record(cut.export);
        if (existingExport) existingExport.stale = true;
        cut.missing = records(cut.shots)
          .filter((shot) => !shot.asset_id)
          .map((shot) => Number(shot.sequence_id));
        await this.snapshots.put({
          projectId: input.projectId,
          cut
        });
        if (this.evaluateShotVideo && !record(target._local_storyboard)) {
          void this.getRenderMetrics(media.id).catch((error: unknown) =>
            console.warn("Could not start local shot evaluation", error)
          );
        }
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "COMPLETED",
          {
            render_asset_id: media.id,
            fps: 24,
            output_url: media.url,
            poster_asset_id: poster.id,
            poster_url: poster.url,
            continues_from: continuesFrom
          }
        );
      }
      await this.snapshots.putPlan(
        input.projectId,
        planId,
        planAt(plan, "COMPLETED")
      );
    } catch (error) {
      if (control.cancelled) return;
      const message =
        error instanceof Error ? error.message : "Local shot rendering failed";
      if (activeStep)
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "FAILED",
          undefined,
          message
        );
      await this.snapshots.putPlan(
        input.projectId,
        planId,
        planAt(plan, "PAUSED", message)
      );
    }
  }

  private async runCutExport(
    input: LocalScriptCutExportInput,
    paths: string[],
    fingerprint: string,
    basePlan: JsonRecord,
    control: RunControl
  ): Promise<void> {
    const planId = String(basePlan.id);
    let plan = planAt(basePlan, "RUNNING");
    await this.snapshots.putPlan(input.projectId, planId, plan);
    const step = this.findStep(plan, "run_summary");
    try {
      plan = await this.setStep(input.projectId, planId, step, "RUNNING");
      const bytes = await concatenateVideos(paths);
      this.throwIfCancelled(control);
      const media = await this.snapshots.storeGeneratedMedia(
        input.projectId,
        bytes,
        "mp4"
      );
      const snapshot = await this.requireSnapshot(input.projectId);
      const cut = structuredClone(snapshot.cut!);
      cut.export = {
        asset_id: media.id,
        plan_id: planId,
        fingerprint,
        url: media.url,
        stale: false
      };
      await this.snapshots.put({ projectId: input.projectId, cut });
      plan = await this.setStep(input.projectId, planId, step, "COMPLETED", {
        asset_id: media.id,
        output_url: media.url
      });
      await this.snapshots.putPlan(
        input.projectId,
        planId,
        planAt(plan, "COMPLETED")
      );
    } catch (error) {
      if (control.cancelled) return;
      const message =
        error instanceof Error ? error.message : "Local cut export failed";
      plan = await this.setStep(
        input.projectId,
        planId,
        step,
        "FAILED",
        undefined,
        message
      );
      await this.snapshots.putPlan(
        input.projectId,
        planId,
        planAt(plan, "PAUSED", message)
      );
    }
  }

  private async runCastingPlan(
    input: LocalScriptCastInput,
    version: number,
    basePlan: JsonRecord,
    control: RunControl
  ): Promise<void> {
    const planId = String(basePlan.id);
    let plan = planAt(basePlan, "RUNNING");
    await this.snapshots.putPlan(input.projectId, planId, plan);
    let activeStep: JsonRecord | undefined;
    try {
      const scriptTextModel = await this.getScriptTextModel();
      let scriptTextModelFile = LOCAL_SCRIPT_TEXT_MODEL_FILES[scriptTextModel];
      const submit = this.findStep(plan, "submit_script_casting");
      if (!completedStep(submit)) {
        activeStep = submit;
        plan = await this.setStep(input.projectId, planId, submit, "RUNNING");
        plan = await this.setStep(
          input.projectId,
          planId,
          submit,
          "COMPLETED",
          {
            model: scriptTextModelFile
          }
        );
      }
      this.throwIfCancelled(control);
      const poll = this.findStep(plan, "poll_script_casting");
      let casting = record(record(poll?.result)?.casting);
      if (!completedStep(poll) || !casting) {
        activeStep = poll;
        plan = await this.setStep(input.projectId, planId, poll, "RUNNING");
        const options = resolveCastOptions(input);
        const cloud = await this.runCloudTextModel(
          "casting",
          {
            script: input.script,
            shot_limit: options.maxShots,
            atomic_shots: options.isAtomicShotsRequested,
            sequence_mode: options.isRenderSequencesRequested,
            include_dialogue: true,
            split_alts: !!options.isCharacterDesignVersionsRequested,
            separate_style: options.isSeparateStyleRequested ?? true,
            separate_camera: !!options.isSeparateCameraRequested
          },
          () => control.cancelled
        );
        if (cloud) scriptTextModelFile = textValue(cloud.model, "cloud");
        casting = cloud
          ? record(cloud.casting)
          : await generateCasting(
              input.script,
              createQwenStructuredCall(async (prompt) => {
                this.throwIfCancelled(control);
                return new ComfyScriptProjectClient(
                  await this.getComfyEndpoint(),
                  scriptTextModel
                ).runCasting(prompt, () => control.cancelled);
              }),
              {
                shotLimit: options.maxShots,
                atomicShots: options.isAtomicShotsRequested,
                sequenceMode: options.isRenderSequencesRequested,
                includeDialogue: true,
                splitAlts: !!options.isCharacterDesignVersionsRequested,
                separateStyle: options.isSeparateStyleRequested ?? true,
                separateCamera: !!options.isSeparateCameraRequested,
                singleCallMaxWords: LOCAL_CASTING_SINGLE_CALL_MAX_WORDS
              }
            );
        this.throwIfCancelled(control);
        if (!casting) throw new Error("Cloud casting returned no casting data");
        plan = await this.setStep(
          input.projectId,
          planId,
          submit,
          "COMPLETED",
          {
            model: scriptTextModelFile,
            text_model_route: cloud ? "cloud" : "local"
          }
        );
        plan = await this.setStep(input.projectId, planId, poll, "COMPLETED", {
          casting,
          version,
          model: scriptTextModelFile,
          text_model_route: cloud ? "cloud" : "local"
        });
      }
      const materialise = this.findStep(plan, "materialise_project_state");
      if (!completedStep(materialise)) {
        activeStep = materialise;
        plan = await this.setStep(
          input.projectId,
          planId,
          materialise,
          "RUNNING"
        );
        const summary = await this.materializeCasting(
          input.projectId,
          casting,
          version,
          planId,
          input
        );
        // The step's result IS the version's summary, as on the cloud.
        plan = await this.setStep(
          input.projectId,
          planId,
          materialise,
          "COMPLETED",
          summary
        );
      }
      await this.snapshots.putPlan(
        input.projectId,
        planId,
        planAt(plan, "COMPLETED")
      );
    } catch (error) {
      if (control.cancelled) return;
      const message =
        error instanceof Error ? error.message : "Local casting failed";
      if (activeStep)
        plan = await this.setStep(
          input.projectId,
          planId,
          activeStep,
          "FAILED",
          undefined,
          message
        );
      await this.snapshots.putPlan(
        input.projectId,
        planId,
        planAt(
          plan,
          // A bad answer fails the run, as the cloud's 502 does; a model that
          // could not be reached pauses it, so it can be resumed.
          error instanceof CastingCallError ? "FAILED" : "PAUSED",
          message
        )
      );
    }
  }

  /**
   * The materialise step, on the
   * local snapshot (see casting/materialiseCasting.ts), then the reads that
   * follow from it — resolved references, the cut and the version entry.
   */
  private async materializeCasting(
    projectId: string,
    casting: JsonRecord,
    version: number,
    planId: string,
    input: LocalScriptCastInput
  ): Promise<JsonRecord> {
    const options = resolveCastOptions(input);
    const snapshot = await this.snapshots.get(projectId);
    await this.projects.renameUntitledFromCasting(
      projectId,
      typeof casting.title === "string" ? casting.title : ""
    );
    const previousState = snapshot?.state;
    await this.projectVisualStyle(projectId, previousState);
    const project = await this.projects.get(projectId);
    const seed = castVisualStyleSeed(
      record(project?.settings),
      casting.visual_style
    );
    if (seed !== null)
      await this.projects.setSettingIfAbsent(projectId, "visual_style", seed);
    const { state: materialised, summary } = materialiseCasting({
      previousState,
      casting,
      maxShots: options.maxShots,
      scriptVersion: version,
      renderSequences: options.isRenderSequencesRequested,
      engine: options.engine,
      targetDurationS: options.targetDurationS
    });
    const state = this.refreshReferences({
      ...materialised,
      project_id: projectId,
      sheets_timeline_id: previousState?.sheets_timeline_id ?? randomUUID()
    });
    // The cut is the current cast only: a dropped shot keeps its renders but
    // is no longer part of the film.
    const currentShots = records(state.shots).filter((shot) => !shot.dropped);
    const previousCut = new Map(
      records(snapshot?.cut?.shots).map((shot) => [
        String(shot.timeline_id),
        shot
      ])
    );
    const cut = {
      ...(snapshot?.cut ?? {}),
      project_id: projectId,
      shots: currentShots.map((shot) => {
        const existing = previousCut.get(String(shot.timeline_id));
        return existing
          ? {
              ...existing,
              shot_index: shot.shot_index,
              sequence_id: shot.sequence_id,
              heading: shot.heading ?? null
            }
          : emptyCutShotEntry(shot);
      }),
      missing: currentShots
        .filter(
          (shot) =>
            !records(previousCut.get(String(shot.timeline_id))?.versions).length
        )
        .map((shot) => shot.sequence_id),
      export: snapshot?.cut?.export ?? null
    };
    await this.snapshots.put({ projectId, state, cut });
    return summary;
  }

  private taggableTokens(state: JsonRecord): Set<string> {
    return new Set(
      records(state.keys)
        .filter((key) => key.enabled !== false)
        .map((key) => textValue(key.token, ""))
    );
  }

  private refreshReferences(state: JsonRecord): JsonRecord {
    state.keys = records(state.keys).map((key) => {
      const effectiveImage = records(key.images).find(
        (image) => image.asset_id === key.effective_asset_id
      );
      return {
        ...key,
        description:
          effectiveImage && hasOwnSheetDescription(key, effectiveImage)
            ? effectiveImage.description
            : (key.seed_description ?? null),
        effective_source: effectiveImage?.source ?? null
      };
    });
    const effective = new Map(
      records(state.keys)
        .filter(
          (key) =>
            key.enabled !== false && typeof key.effective_asset_id === "string"
        )
        .map((key) => [String(key.token), String(key.effective_asset_id)])
    );
    const enabledTokens = new Set(
      records(state.keys)
        .filter((key) => key.enabled !== false)
        .map((key) => String(key.token))
    );
    state.shots = records(state.shots).map((shot) => {
      const tags = record(shot.tags) ?? {};
      const references: Record<
        string,
        Array<{ token: string; asset_id: string }>
      > = {};
      const missing: Array<{ token: string; reason: string }> = [];
      for (const kind of ["characters", "environments", "props"]) {
        const resolved = strings(tags[kind]).flatMap((token) => {
          // A disabled entity holds the shot up for a
          // different reason than one with no image yet, and says which.
          if (!enabledTokens.has(token)) {
            missing.push({ token, reason: "disabled" });
            return [];
          }
          const assetId = effective.get(token);
          if (!assetId) {
            missing.push({ token, reason: "no image" });
            return [];
          }
          return [{ token, asset_id: assetId }];
        });
        if (resolved.length) references[kind] = resolved;
      }
      return {
        ...shot,
        references,
        missing_references: missing
      };
    });
    return state;
  }

  async assertLocalProject(projectId: string): Promise<void> {
    const project = await this.projects.get(projectId);
    if (!project) throw new Error("Local script project not found");
    if (project.origin === "cloud") {
      throw new Error(
        "Cloud projects can only use the Mago Cloud script pipeline"
      );
    }
    if (project.type !== "script_to_shots")
      throw new Error("This is not a script-to-shots project");
  }

  private async requireSnapshot(
    projectId: string
  ): Promise<LocalScriptProjectSnapshot & { state: JsonRecord }> {
    const snapshot = await this.snapshots.get(projectId);
    if (!snapshot?.state) throw new Error("Cast the script before rendering");
    const visualStyle = await this.projectVisualStyle(
      projectId,
      snapshot.state
    );
    return {
      ...snapshot,
      state: {
        ...snapshot.state,
        ...(visualStyle || "visual_style" in snapshot.state
          ? { visual_style: visualStyle }
          : {})
      }
    };
  }

  private async projectVisualStyle(
    projectId: string,
    state: JsonRecord | null | undefined
  ): Promise<string> {
    const project = await this.projects.get(projectId);
    if (!project) return "";
    const settings = record(project.settings) ?? {};
    if (
      !("visual_style" in settings) &&
      state &&
      "visual_style" in state &&
      visualStyleError(state.visual_style) === null
    ) {
      await this.projects.setSettingIfAbsent(
        projectId,
        "visual_style",
        state.visual_style ?? null
      );
      return readProjectVisualStyle(
        record((await this.projects.get(projectId))?.settings)
      );
    }
    return readProjectVisualStyle(settings);
  }

  private async requireCloudSheetPlan(
    projectId: string,
    planId: string
  ): Promise<JsonRecord> {
    const plan = await this.requirePlan(planId);
    if (
      plan.project_id !== projectId ||
      plan.local_executor !== CLOUD_SHEET_EXECUTOR
    )
      throw new Error("Cloud sheet plan does not belong to this project");
    return plan;
  }

  /** The renderer submitted one key's cloud render: record the cloud clip so
   * a resumed plan polls it instead of paying for a second render. */
  private async startCloudSheetRender(
    projectId: string,
    payload: JsonRecord
  ): Promise<JsonRecord> {
    const planId = textValue(payload.planId, "");
    const token = textValue(payload.token, "");
    let plan = await this.requireCloudSheetPlan(projectId, planId);
    const submit = this.findStep(
      plan,
      "submit_img2img_batch",
      undefined,
      token
    );
    if (!completedStep(submit)) {
      plan = await this.setStep(projectId, planId, submit, "RUNNING");
      plan = await this.setStep(
        projectId,
        planId,
        this.findStep(plan, "submit_img2img_batch", undefined, token),
        "COMPLETED",
        {
          token,
          submitted: true,
          cloud_clip_id: textValue(payload.cloudClipId, ""),
          cloud_asset_id: textValue(payload.cloudAssetId, "")
        }
      );
    }
    if (plan.status === "PENDING") {
      plan = planAt(plan, "RUNNING");
      await this.snapshots.putPlan(projectId, planId, plan);
    }
    return this.setStep(
      projectId,
      planId,
      this.findStep(plan, "poll_img2img_batch", undefined, token),
      "RUNNING"
    );
  }

  /** One key's cloud render landed: keep it as a local version of the key. */
  private async addCloudSheetRender(
    projectId: string,
    payload: JsonRecord
  ): Promise<JsonRecord> {
    const planId = textValue(payload.planId, "");
    const token = textValue(payload.token, "");
    const plan = await this.requireCloudSheetPlan(projectId, planId);
    const outputUrl = textValue(payload.outputUrl, "");
    if (!outputUrl.startsWith("https://"))
      throw new Error("Cloud sheet output must use HTTPS");
    const media = await this.snapshots.storeRemoteMedia(projectId, outputUrl);
    if (!media.isImage) throw new Error("Cloud sheet output is not an image");
    const target = records(plan.local_targets).find(
      (candidate) => candidate.token === token
    );
    const spec = record(payload.renderSpec) ?? record(target?._local_spec);
    const key = await this.withProjectStateWrite(projectId, async () => {
      const snapshot = await this.requireSnapshot(projectId);
      const state = structuredClone(snapshot.state!);
      const key = records(state.keys).find(
        (candidate) => candidate.token === token
      );
      if (!key) throw new Error("Local reference-sheet entity not found");
      const prompt = textValue(
        payload.prompt,
        textValue(target?._local_prompt, "")
      );
      const settings = record(payload.renderSettings) ?? {};
      key.images = [
        ...records(key.images),
        {
          asset_id: media.id,
          clip_id: randomUUID(),
          name: `${textValue(key.name, token)} ${records(key.images).length + 1}`,
          status: "available",
          source: "render",
          url: media.url,
          thumbnail_url: media.url,
          created_at: nowIso(),
          prompt,
          render_settings: { prompt, ...settings },
          cloud_asset_id: textValue(payload.cloudAssetId, "") || null,
          fingerprint: spec ? fingerprint(spec) : null,
          ...(target && isStoryboard(target)
            ? {
                storyboard_plan_id: planId,
                storyboard_scene_fingerprint:
                  target.storyboard_scene_fingerprint,
                panel_count: target.panel_count,
                render_spec: spec
              }
            : {}),
          description: null,
          has_description: false,
          description_source: null
        }
      ];
      if (spec) key.last_spec = spec;
      if (!isStoryboard(key)) key.selected_asset_id = media.id;
      key.effective_asset_id =
        isStoryboard(key) && typeof key.selected_asset_id === "string"
          ? key.selected_asset_id
          : media.id;
      key.effective_source = "render";
      await this.snapshots.put({
        projectId,
        state: this.refreshReferences(state)
      });
      return key;
    });
    const completed = await this.setStep(
      projectId,
      planId,
      this.findStep(plan, "poll_img2img_batch", undefined, token),
      "COMPLETED",
      {
        token,
        asset_ids: [media.id],
        output_url: media.url,
        cloud_asset_id: textValue(payload.cloudAssetId, "") || null
      }
    );
    const isComplete = records(completed.steps)
      .filter((step) => step.tool_name === "poll_img2img_batch")
      .every((step) => completedStep(step));
    if (isComplete) {
      await this.snapshots.putPlan(
        projectId,
        planId,
        planAt(completed, "COMPLETED")
      );
      this.releaseRenderer(planId);
    }
    return key;
  }

  /** A key's cloud render failed: pause the plan so it can be resumed, as a
   * local render failure does. */
  private async failCloudSheetRender(
    projectId: string,
    payload: JsonRecord
  ): Promise<JsonRecord> {
    const planId = textValue(payload.planId, "");
    const token = textValue(payload.token, "");
    const message = textValue(
      payload.message,
      "Mago Cloud sheet rendering failed"
    );
    const plan = await this.requireCloudSheetPlan(projectId, planId);
    const poll = this.findStep(plan, "poll_img2img_batch", undefined, token);
    const step = completedStep(
      this.findStep(plan, "submit_img2img_batch", undefined, token)
    )
      ? poll
      : this.findStep(plan, "submit_img2img_batch", undefined, token);
    const failed = await this.setStep(
      projectId,
      planId,
      step,
      "FAILED",
      undefined,
      message
    );
    const paused = planAt(failed, "PAUSED", message);
    await this.snapshots.putPlan(projectId, planId, paused);
    this.releaseRenderer(planId);
    return paused;
  }

  /** The cloud's reference existence check, against local media. */
  private async assertReferenceImagesExist(assetIds: string[]): Promise<void> {
    for (const assetId of assetIds) {
      const found =
        (await this.snapshots.resolveMediaPath(assetId)) ??
        (await this.projects.resolveMediaPath("asset", assetId));
      if (!found)
        throw new SheetRunError(`Reference asset ${assetId} not found`);
    }
  }

  /** Store, or with `{}` clear. */
  private async saveSheetReferences(
    projectId: string,
    token: string,
    references: SheetReferences
  ): Promise<void> {
    const snapshot = await this.requireSnapshot(projectId);
    const state = structuredClone(snapshot.state!);
    const key = records(state.keys).find(
      (candidate) => candidate.token === token
    );
    if (!key) throw new SheetRunError("Sheet group not found");
    delete key.reference_asset_ids;
    delete key.reference_instruction;
    Object.assign(key, references);
    await this.snapshots.put({ projectId, state });
  }

  private async saveCreatedSheetGroup(
    projectId: string,
    createdSheetGroup: JsonRecord
  ): Promise<void> {
    const snapshot = await this.requireSnapshot(projectId);
    const state = structuredClone(snapshot.state!);
    const existingKeys = records(state.keys);
    const isSheetGroupAlreadySaved = existingKeys.some(
      (key) => key.token === createdSheetGroup.token
    );
    if (isSheetGroupAlreadySaved) return;
    state.keys = [...existingKeys, createdSheetGroup];
    await this.snapshots.put({
      projectId,
      state: this.refreshReferences(state)
    });
  }

  private async supersedeResumablePlansHoldingItems(
    projectId: string,
    operation: LocalPlanOperation,
    supersedingPlanId: string,
    selectStepsForSupersededItems: (
      supersededPlan: JsonRecord
    ) => (step: JsonRecord) => boolean
  ): Promise<void> {
    const snapshot = await this.requireSnapshot(projectId);
    for (const [planId, plan] of Object.entries(snapshot.planDetails ?? {})) {
      if (plan.local_operation !== operation) continue;
      const supersededSteps = supersedeResumablePlanSteps({
        plan,
        isStepForSupersededItem: selectStepsForSupersededItems(plan),
        supersedingPlanId,
        supersededAt: nowIso()
      });
      if (!supersededSteps) continue;
      const previousErrorMessage = textValue(record(plan.error)?.message, "");
      const updated = planAt(
        { ...plan, steps: supersededSteps },
        String(plan.status),
        previousErrorMessage || undefined
      );
      await this.snapshots.putPlan(projectId, planId, updated);
    }
  }

  private assertIdle(projectId: string): void {
    if (this.projectRuns.has(projectId)) {
      throw new Error("This local script project already has a job running");
    }
  }

  private async requirePlan(planId: string): Promise<JsonRecord> {
    const plan = await this.snapshots.getPlan(planId);
    if (!plan) throw new Error("Local plan not found");
    return plan;
  }

  private async requireLocallyRunPlan(planId: string): Promise<JsonRecord> {
    const plan = await this.requirePlan(planId);
    const isMirroredCloudPlan = typeof plan.local_operation !== "string";
    const project =
      typeof plan.project_id === "string"
        ? await this.projects.get(plan.project_id)
        : null;
    if (isMirroredCloudPlan || project?.origin === "cloud") {
      throw new Error(
        "This plan runs on Mago Cloud and can only be changed there"
      );
    }
    return plan;
  }

  private findStep(
    plan: JsonRecord,
    toolName: string,
    timelineId?: string,
    token?: string
  ): JsonRecord | undefined {
    return records(plan.steps).find(
      (step) =>
        step.tool_name === toolName &&
        (timelineId === undefined || step.timeline_id === timelineId) &&
        (token === undefined || record(step.tool_args)?.token === token)
    );
  }

  private async setStep(
    projectId: string,
    planId: string,
    selected: JsonRecord | undefined,
    status: "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED",
    result?: JsonRecord,
    error?: string
  ): Promise<JsonRecord> {
    if (!selected) throw new Error("Local plan step is missing");
    const current = await this.requirePlan(planId);
    if (current.status === "CANCELLED") return current;
    const timestamp = nowIso();
    const steps = records(current.steps).map((step) =>
      step.id === selected.id
        ? {
            ...step,
            status,
            ...(status === "RUNNING" && !step.started_at
              ? { started_at: timestamp }
              : {}),
            ...(["COMPLETED", "FAILED", "SKIPPED"].includes(status)
              ? { finished_at: timestamp }
              : {}),
            ...(result === undefined ? {} : { result }),
            error: error ? { message: error } : null
          }
        : step
    );
    const updated = planAt({ ...current, steps }, "RUNNING");
    await this.snapshots.putPlan(projectId, planId, updated);
    return updated;
  }

  private withProjectStateWrite<T>(
    projectId: string,
    write: () => Promise<T>
  ): Promise<T> {
    const previous =
      this.projectStateWrites.get(projectId) ?? Promise.resolve();
    const result = previous
      .catch(() => undefined)
      .then(write)
      .finally(() => {
        if (this.projectStateWrites.get(projectId) === result)
          this.projectStateWrites.delete(projectId);
      });
    this.projectStateWrites.set(projectId, result);
    return result;
  }

  private throwIfCancelled(control: RunControl): void {
    if (control.cancelled) throw new Error("Local plan cancelled");
  }

  private waitForRenderer(
    projectId: string,
    planId: string,
    shouldQueue = false
  ): void {
    const start = shouldQueue
      ? this.startOrQueueRun.bind(this)
      : this.startRun.bind(this);
    start(projectId, planId, async () => {
      if (shouldQueue) {
        const plan = await this.requirePlan(planId);
        await this.snapshots.putPlan(
          projectId,
          planId,
          planAt(plan, "RUNNING")
        );
      }
      return new Promise<void>((resolve) => {
        this.rendererPlanWaiters.set(planId, resolve);
      });
    });
  }

  private releaseRenderer(planId: string): void {
    this.rendererPlanWaiters.get(planId)?.();
    this.rendererPlanWaiters.delete(planId);
  }

  private startRun(
    projectId: string,
    planId: string,
    task: (control: RunControl) => Promise<void>
  ): void {
    const control: RunControl = { planId, projectId, cancelled: false };
    const promise = task(control).finally(() => {
      if (this.projectRuns.get(projectId)?.control === control) {
        this.projectRuns.delete(projectId);
        this.startNextQueuedRun(projectId);
      }
    });
    this.projectRuns.set(projectId, { control, promise });
    void promise;
  }

  private startOrQueueRun(
    projectId: string,
    planId: string,
    task: (control: RunControl) => Promise<void>
  ): void {
    if (!this.projectRuns.has(projectId)) {
      this.startRun(projectId, planId, task);
      return;
    }
    this.queuedRuns.set(projectId, [
      ...(this.queuedRuns.get(projectId) ?? []),
      { planId, task }
    ]);
  }

  private startNextQueuedRun(projectId: string): void {
    const [next, ...rest] = this.queuedRuns.get(projectId) ?? [];
    if (rest.length) this.queuedRuns.set(projectId, rest);
    else this.queuedRuns.delete(projectId);
    if (next) this.startRun(projectId, next.planId, next.task);
  }

  private isRunQueued(projectId: string, planId: string): boolean {
    return (this.queuedRuns.get(projectId) ?? []).some(
      (queued) => queued.planId === planId
    );
  }

  private removeQueuedRun(projectId: string, planId: string): void {
    const remaining = (this.queuedRuns.get(projectId) ?? []).filter(
      (queued) => queued.planId !== planId
    );
    if (remaining.length) this.queuedRuns.set(projectId, remaining);
    else this.queuedRuns.delete(projectId);
  }
}
