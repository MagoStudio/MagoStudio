import {
  parseImg2ImgStatus,
  toImg2ImgJobStatus
} from "@domains/cloud/img2imgStatus";
import {
  CloudApi,
  ensureCloudImageAsset,
  ensureCloudProject,
  ensureCloudTimeline
} from "@domains/cloud/mirrorService";
import { isCloudRenderAvailable } from "@platform/renderTarget";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";
import { readProviderPreferences } from "@/platform/providerPreferences";

import {
  DEFAULT_SHEET_IMAGE_FILE_TYPE,
  SHEET_RENDER_MODELS,
  SheetRenderModel
} from "./constants";
import { DEFAULT_OUTPUT_SIZE } from "./utils/buildOutputSize";

/**
 * Renders a local project's reference sheets on a Mago Cloud image model.
 *
 * The desktop plans the run exactly as it plans a local one (which keys,
 * their prompts and specs) and then waits; this side mirrors the inputs to
 * the cloud, renders each key through `/assets/img2img/render`, and hands
 * every finished image back to the desktop, which keeps it as a local
 * version.
 */

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_ATTEMPTS = 100;

/** utils/img2img.py TEXT_TO_IMAGE_EDIT_MODEL: a key with references renders
 * through its model's edit sibling. */
export const SHEET_IMAGE_EDIT_MODEL_BY_RENDER_MODEL: Record<
  SheetRenderModel,
  string
> = {
  seedream_5_pro_t2i: "seedream_5_pro",
  gpt_image_2_t2i: "gpt_image_2",
  nanobanana_2_t2i: "nanobanana_2"
};

/** `local_executor` of a sheet plan this module runs. */
export const CLOUD_SHEET_EXECUTOR = "mago-cloud-renderer";

type JsonRecord = Record<string, unknown>;

const textValue = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;
const records = (value: unknown): JsonRecord[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is JsonRecord =>
          !!item && typeof item === "object" && !Array.isArray(item)
      )
    : [];

const cloudApi: CloudApi = {
  post: async <T>(url: string, body?: unknown): Promise<T> =>
    (await backendApiClient.post<T>(url, body)).data,
  get: async <T>(url: string): Promise<T> =>
    (await backendApiClient.get<T>(url)).data
};

export const canUseCloudSheetModels = (): boolean =>
  isCloudRenderAvailable() && readProviderPreferences()["mago-cloud"];

const isCloudSheetModel = (value: unknown): value is SheetRenderModel =>
  typeof value === "string" &&
  (SHEET_RENDER_MODELS as readonly string[]).includes(value);

const findRenderClip = (
  response: unknown
): { assetId: string; clipId: string } | null => {
  const clips = (
    response as { clips?: { id?: unknown; asset?: { id?: unknown } }[] }
  )?.clips;
  if (!Array.isArray(clips)) return null;
  for (const clip of [...clips].reverse()) {
    if (typeof clip.id === "string" && typeof clip.asset?.id === "string") {
      return { assetId: clip.asset.id, clipId: clip.id };
    }
  }
  return null;
};

const isPlanCancelled = async (planId: string): Promise<boolean> =>
  (await getLocalDesktopApi().scriptProjects.getPlan(planId))?.status ===
  "CANCELLED";

const waitForOutput = async (
  clipId: string,
  planId: string
): Promise<string> => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    if (await isPlanCancelled(planId)) throw new Error("Local plan cancelled");
    const parsed = parseImg2ImgStatus(
      await cloudApi.get<unknown>(`/assets/img2img/status/${clipId}`)
    );
    const status = toImg2ImgJobStatus(parsed.status);
    if (status === "SUCCESS" && parsed.outputUrl) return parsed.outputUrl;
    if (status === "FAILED" || status === "CANCELLED") {
      throw new Error(`Mago Cloud image render ${status.toLowerCase()}`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error("Mago Cloud image render did not finish in time");
};

type CloudSheetTarget = {
  projectId: string;
  planId: string;
  cloudProjectId: string;
  cloudTimelineId: string;
  renderModel: SheetRenderModel;
  outputSize: [number, number];
  target: JsonRecord;
  existingCloudClip?: { assetId: string; clipId: string };
  mutateLocalProject: <T>(mutation: () => Promise<T>) => Promise<T>;
};

/** A design variant edits its master's current image, read at render time so
 * a master re-rendered earlier in this run is the one it edits. */
const resolveMasterAssetId = async (
  projectId: string,
  masterToken: string | null
): Promise<string | null> => {
  if (!masterToken) return null;
  const snapshot = await getLocalDesktopApi().scriptProjects.get(projectId);
  const master = records(
    (snapshot?.state as { keys?: unknown } | null)?.keys
  ).find((key) => key.token === masterToken);
  if (typeof master?.effective_asset_id !== "string") {
    throw new Error(
      `Render the master design ${masterToken} before its variants`
    );
  }
  return master.effective_asset_id;
};

const renderTarget = async (input: CloudSheetTarget): Promise<void> => {
  const desktop = getLocalDesktopApi();
  const { target } = input;
  const token = textValue(target.token);
  const masterAssetId = await resolveMasterAssetId(
    input.projectId,
    typeof target.master_token === "string" ? target.master_token : null
  );
  const localSourceIds = [
    ...(masterAssetId ? [masterAssetId] : []),
    ...(Array.isArray(target._local_reference_asset_ids)
      ? target._local_reference_asset_ids.map(String)
      : [])
  ].filter((id, index, ids) => ids.indexOf(id) === index);
  const cloudSourceIds = await Promise.all(
    localSourceIds.map((assetId) =>
      ensureCloudImageAsset(cloudApi, assetId, input.cloudProjectId)
    )
  );
  const plannedSize = Array.isArray(
    (target._local_spec as JsonRecord | undefined)?.output_size
  )
    ? ((target._local_spec as JsonRecord).output_size as number[])
    : input.outputSize;
  const [width, height] = plannedSize;
  const [sourceAssetId, ...referenceImages] = cloudSourceIds;
  // As on the cloud, the first reference is the input image, the
  // rest ride as reference_images, and the render goes to the edit sibling.
  const renderModel = sourceAssetId
    ? SHEET_IMAGE_EDIT_MODEL_BY_RENDER_MODEL[input.renderModel]
    : input.renderModel;
  const prompt = textValue(
    target.kind === "character"
      ? (target._local_cloud_prompt ?? target._local_render_prompt)
      : target._local_render_prompt,
    textValue(target._local_prompt, textValue(target.prompt, token))
  );
  const clip =
    input.existingCloudClip ??
    findRenderClip(
      await cloudApi.post<unknown>("/assets/img2img/render", {
        timeline_id: input.cloudTimelineId,
        sheet_token: token,
        sheet_name: textValue(target.name, token),
        ...(typeof target.kind === "string" ? { sheet_kind: target.kind } : {}),
        ...(target.body_plan ? { body_plan: target.body_plan } : {}),
        ...(Array.isArray(target.distinctive_features) &&
        target.distinctive_features.length
          ? { distinctive_features: target.distinctive_features }
          : {}),
        ...(sourceAssetId ? { source_asset: sourceAssetId, frame: 0 } : {}),
        img_file_type: DEFAULT_SHEET_IMAGE_FILE_TYPE,
        render_model: renderModel,
        render_mode: "credits",
        ...(target.role === "storyboard" ? { spec: {} } : {}),
        settings: {
          prompt,
          width,
          height,
          ...(target.role === "storyboard" ? { quality: "medium" } : {}),
          ...(sourceAssetId
            ? {
                input_image_id: sourceAssetId,
                reference_images: referenceImages
              }
            : {})
        }
      })
    );
  if (!clip) throw new Error("Mago Cloud did not return an image render");
  await input.mutateLocalProject(() =>
    desktop.scriptProjects.update({
      projectId: input.projectId,
      operation: "start-cloud-sheet-render",
      payload: {
        planId: input.planId,
        token,
        cloudClipId: clip.clipId,
        cloudAssetId: clip.assetId
      }
    })
  );
  const outputUrl = await waitForOutput(clip.clipId, input.planId);
  const plannedSpec =
    target._local_spec && typeof target._local_spec === "object"
      ? (target._local_spec as JsonRecord)
      : null;
  await input.mutateLocalProject(() =>
    desktop.scriptProjects.update({
      projectId: input.projectId,
      operation: "add-cloud-sheet-render",
      payload: {
        planId: input.planId,
        token,
        prompt,
        outputUrl,
        cloudAssetId: clip.assetId,
        renderSettings: {
          render_model: renderModel,
          width,
          height,
          ...(localSourceIds.length
            ? { source_asset_id: localSourceIds[0] }
            : {}),
          ...(localSourceIds.length > 1
            ? { reference_images: localSourceIds.slice(1) }
            : {})
        },
        ...(plannedSpec
          ? {
              renderSpec: {
                ...plannedSpec,
                ...(masterAssetId ? { master_asset_id: masterAssetId } : {})
              }
            }
          : {})
      }
    })
  );
};

const FINISHED_STEP_STATUSES = ["COMPLETED", "SKIPPED"];

/**
 * Runs (or resumes) a cloud sheet plan the desktop created. Keys render
 * concurrently, design variants after the masters they edit. A key whose
 * cloud clip was already submitted is polled rather than paid for again.
 */
export const executeCloudSheetPlan = async (planId: string): Promise<void> => {
  const desktop = getLocalDesktopApi();
  let plan = await desktop.scriptProjects.getPlan(planId);
  if (!plan || plan.local_executor !== CLOUD_SHEET_EXECUTOR) return;
  if (
    records(plan.local_targets).some((target) => target.role === "storyboard")
  ) {
    while (plan?.status === "PENDING") {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      plan = await desktop.scriptProjects.getPlan(planId);
    }
    if (!plan || plan.status !== "RUNNING") return;
  }
  const projectId = textValue(plan.project_id);
  const request = (plan.local_request ?? {}) as JsonRecord;
  const settings = (request.settings ?? {}) as JsonRecord;
  const steps = records(plan.steps);
  const tokenOf = (step: JsonRecord) =>
    textValue((step.tool_args as JsonRecord | undefined)?.token);
  const fail = (token: string, message: string) =>
    desktop.scriptProjects.update({
      projectId,
      operation: "fail-cloud-sheet-render",
      payload: { planId, token, message }
    });
  const firstToken = textValue(records(plan.local_targets)[0]?.token);

  if (!isCloudSheetModel(settings.render_model)) {
    await fail(firstToken, "Unknown Mago Cloud image model");
    return;
  }
  if (!canUseCloudSheetModels()) {
    await fail(firstToken, "Sign in to Mago Cloud to use this image model");
    return;
  }
  const renderModel = settings.render_model;
  const outputSize: [number, number] =
    Array.isArray(request.outputSize) && request.outputSize.length === 2
      ? [Number(request.outputSize[0]), Number(request.outputSize[1])]
      : DEFAULT_OUTPUT_SIZE;
  const finishedTokens = new Set(
    steps
      .filter(
        (step) =>
          step.tool_name === "poll_img2img_batch" &&
          FINISHED_STEP_STATUSES.includes(String(step.status))
      )
      .map(tokenOf)
  );
  const submitted = new Map(
    steps.flatMap((step) => {
      const result = (step.result ?? {}) as JsonRecord;
      return step.tool_name === "submit_img2img_batch" &&
        typeof result.cloud_clip_id === "string" &&
        result.cloud_clip_id &&
        typeof result.cloud_asset_id === "string"
        ? [
            [
              tokenOf(step),
              {
                clipId: result.cloud_clip_id,
                assetId: result.cloud_asset_id
              }
            ] as const
          ]
        : [];
    })
  );

  let cloudProjectId: string;
  let cloudTimelineId: string;
  try {
    const project = await desktop.projects.get(projectId);
    if (!project) throw new Error("Local script project not found");
    const snapshot = await desktop.scriptProjects.get(projectId);
    const sheetsTimelineId = textValue(
      (snapshot?.state as { sheets_timeline_id?: unknown } | null)
        ?.sheets_timeline_id
    );
    if (!sheetsTimelineId)
      throw new Error("Local script project has no sheet timeline");
    cloudProjectId = await ensureCloudProject(cloudApi, {
      localProjectId: projectId,
      name: project.name
    });
    cloudTimelineId = await ensureCloudTimeline(cloudApi, {
      localShotId: sheetsTimelineId,
      localProjectId: projectId,
      cloudProjectId,
      name: "Reference sheets"
    });
  } catch (error) {
    await fail(
      firstToken,
      error instanceof Error ? error.message : "Mago Cloud is unavailable"
    );
    return;
  }

  // Step writes go one at a time: each rewrites the whole plan record.
  let queue: Promise<unknown> = Promise.resolve();
  const mutateLocalProject = <T>(mutation: () => Promise<T>): Promise<T> => {
    const result = queue.then(mutation, mutation);
    queue = result.catch(() => undefined);
    return result;
  };

  const targets = records(plan.local_targets).filter(
    (target) => !finishedTokens.has(textValue(target.token))
  );
  const pendingTokens = new Set(
    targets.map((target) => textValue(target.token))
  );
  const dependents = targets.filter((target) =>
    pendingTokens.has(textValue(target.master_token))
  );
  const independents = targets.filter((target) => !dependents.includes(target));
  const failures: Array<{ token: string; error: unknown }> = [];
  const runWave = async (wave: JsonRecord[]) => {
    await Promise.all(
      wave.map(async (target) => {
        const token = textValue(target.token);
        try {
          await renderTarget({
            projectId,
            planId,
            cloudProjectId,
            cloudTimelineId,
            renderModel,
            outputSize,
            target,
            existingCloudClip: submitted.get(token),
            mutateLocalProject
          });
        } catch (error) {
          failures.push({ token, error });
        }
      })
    );
  };
  await runWave(independents);
  if (!failures.length) await runWave(dependents);
  if (!failures.length || (await isPlanCancelled(planId))) return;
  const [failure] = failures;
  await mutateLocalProject(() =>
    fail(
      failure!.token,
      failure!.error instanceof Error
        ? failure!.error.message
        : "Mago Cloud sheet rendering failed"
    )
  );
};
