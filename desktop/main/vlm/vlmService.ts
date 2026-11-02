import { readFile } from "node:fs/promises";

import { nativeImage } from "electron";

import type {
  LocalAsset,
  LocalAssetPromptResult,
  LocalAutoPromptInput,
  LocalAutoPromptResult,
  LocalAutoPromptSaveInput,
  LocalEnhancePromptInput,
  LocalEnhancePromptResult,
  VlmModelStatus
} from "../../shared/contracts";
import type { ProjectRepository } from "../database/projectRepository";
import { runBackgroundTask } from "../libraryHealth";
import type { LibrarySettings } from "../librarySettings";
import {
  createReferenceGrid,
  extractMetricsFrameGrid
} from "../scriptProjects/localScriptMedia";

import { ComfyVlmClient } from "./comfyVlmClient";
import {
  extractJsonObject,
  readCachedPrompt,
  toPositivePrompt,
  toStructuredPrompt,
  type StructuredPrompt
} from "./promptJson";
import { AUTO_PROMPT_IMG2IMG } from "./prompts/autoPromptImg2Img";
import { AUTO_PROMPT_VIDEO2VIDEO } from "./prompts/autoPromptVideo2Video";
import { entityDescriptionPrompt } from "./prompts/entityDescription";
import { IMAGE_DESCRIPTION_PROMPT } from "./prompts/imageDescription";
import { PROMPT_ENHANCER_KONTEXT } from "./prompts/promptEnhancerKontext";
import { STYLE_REFERENCE_PROMPT } from "./prompts/styleReference";
import { VIDEO_DESCRIPTION_PROMPT } from "./prompts/videoDescription";
import { extractVideoCaptionFrames } from "./videoFrames";
import {
  buildVideoMetricsPrompt,
  parseVideoMetrics,
  sampleMetricsTimestamps,
  type ShotVideoEvaluationInput
} from "./videoMetrics";
import {
  QWEN3_VL_HERETIC_MODEL_SOURCE,
  QWEN3_VL_MODEL_SOURCE
} from "./vlmModelFiles";

/**
 * The local replacement for the cloud VLM endpoints, backed by the selected
 * Qwen3-VL model in ComfyUI:
 *
 *   GET  /assets/<id>/prompt   → captionAsset      (image: style.txt,
 *                                                   video: ingestion video.txt)
 *   POST /chat/auto-prompt     → autoPrompt
 *   POST /assets/<id>/auto_prompt → saveAutoPrompt
 *   POST /chat/enhance-prompt  → enhancePrompt
 *
 * Response shapes match the cloud ones exactly, so the renderer only needs a
 * `window.mago` branch in its api functions.
 */

/** Reference images are downscaled to this before they reach the VLM, matching
 *  AUTO_PROMPT_IMAGE_MAX_DIMENSION in the renderer. */
const IMAGE_MAX_DIMENSION = 1024;

const SYSTEM_PROMPT =
  "You are a precise visual analysis assistant. Follow the user's output " +
  "format exactly and never add commentary outside it.";

/** Captions are structured JSON and can be long; AutoPrompt is a sentence. */
const CAPTION_MAX_TOKENS = 1400;
/** Entity and plain-image descriptions are both two or three sentences. */
const DESCRIPTION_MAX_TOKENS = 384;
const AUTO_PROMPT_MAX_TOKENS = 512;
const ENHANCE_MAX_TOKENS = 512;
const METRICS_FRAMES_PER_GRID = 4;

const storedDescription = (asset: LocalAsset): string | null =>
  typeof asset.data.description === "string" ? asset.data.description : null;

type GenerateRequest = {
  userPrompt: string;
  images?: Buffer[];
  maxTokens: number;
  temperature?: number;
};

export class VlmService {
  /** In-flight captions per asset, so two hooks asking at once share one run. */
  private readonly pending = new Map<string, Promise<LocalAssetPromptResult>>();

  /** In-flight descriptions per asset: an upload hook and an adaptation asking
   *  for the same image at once share one caption. */
  private readonly pendingDescriptions = new Map<
    string,
    Promise<string | null>
  >();

  /**
   * Serialises every generation. ComfyUI has one queue shared with image and
   * video renders, so letting several captions in at once would push a render
   * the user just started behind minutes of captioning.
   */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly repository: ProjectRepository,
    private readonly settings: LibrarySettings
  ) {}

  /**
   * Cheap /object_info probe — deliberately not queued behind generations, and
   * deliberately not folded into `comfy.check()`, which every local render
   * pre-flight calls.
   */
  async status(): Promise<VlmModelStatus> {
    try {
      const endpoint = await this.settings.getComfyEndpoint();
      const backend = await this.settings.getVlmBackend();
      const models = await new ComfyVlmClient(endpoint, backend).probeModels();
      const installMessage =
        backend === "qwen3-vl-4b-heretic-int8"
          ? `Download ${models.missing.join(" and ")} from ${QWEN3_VL_HERETIC_MODEL_SOURCE} into ComfyUI/models/text_encoders/`
          : `Download ${models.missing.join(" and ")} from ${QWEN3_VL_MODEL_SOURCE} into ComfyUI/models/LLM/GGUF/`;
      return {
        backend,
        ready: models.installed,
        missingModels: [...models.missing],
        message: models.installed ? null : installMessage
      };
    } catch (error) {
      // Missing node, or ComfyUI went away between the endpoint check and here.
      return {
        backend: await this.settings.getVlmBackend(),
        ready: false,
        missingModels: [],
        message: this.message(error)
      };
    }
  }

  async captionAsset(assetId: string): Promise<LocalAssetPromptResult> {
    if (!assetId) throw new Error("Asset ID is required");
    const existing = this.pending.get(assetId);
    if (existing) return existing;
    const run = this.generateAssetPrompt(assetId).finally(() =>
      this.pending.delete(assetId)
    );
    this.pending.set(assetId, run);
    return run;
  }

  /**
   * Describe the entity depicted by one script-project reference sheet.
   * Unlike `captionAsset`, this deliberately ignores the sheet layout and
   * returns plain prose suitable for MiniMax's reference inventory.
   */
  async describeEntityImage(sourcePath: string, kind: string): Promise<string> {
    const request = entityDescriptionPrompt(kind);
    const description = await this.generate({
      userPrompt: request.prompt,
      images: [await this.loadImage(sourcePath)],
      maxTokens: DESCRIPTION_MAX_TOKENS,
      temperature: 0.1
    });
    if (!description) throw new Error("Qwen3-VL returned an empty description");
    return description;
  }

  /** Same judge contract as the backend, using the configured local VLM. */
  async evaluateShotVideo(
    input: ShotVideoEvaluationInput
  ): Promise<Record<string, unknown>> {
    const timestamps = sampleMetricsTimestamps(input.durationSeconds);
    const images: Buffer[] = [];
    if (input.referencePaths.length) {
      images.push(
        input.referencePaths.length === 1
          ? await this.loadImage(input.referencePaths[0]!)
          : this.resize(await createReferenceGrid(input.referencePaths))
      );
    }
    for (
      let index = 0;
      index < timestamps.length;
      index += METRICS_FRAMES_PER_GRID
    ) {
      images.push(
        await extractMetricsFrameGrid(
          input.sourcePath,
          timestamps.slice(index, index + METRICS_FRAMES_PER_GRID),
          input.durationSeconds
        )
      );
    }
    const text = await this.generate({
      userPrompt: buildVideoMetricsPrompt(
        input.prompt,
        timestamps,
        input.referencePaths.length > 0
      ),
      images,
      maxTokens: 2048,
      temperature: 0.1
    });
    return {
      ...parseVideoMetrics(text),
      model: await this.settings.getVlmBackend(),
      frame_count: timestamps.length,
      source_analysis: null,
      ref_assets_loaded: input.referencePaths.length
    };
  }

  /**
   * An image asset's `description` — the backend's image description
   * without a kind: plain prose about the picture, not a reference sheet's
   * entity. Generated once and stored; an existing description, including one
   * the user cleared to blank, is returned as is and never regenerated.
   *
   * Resolves to null for a non-image, or an image whose file is not available.
   */
  async describeImageAsset(assetId: string): Promise<string | null> {
    if (!assetId) throw new Error("Asset ID is required");
    const existing = this.pendingDescriptions.get(assetId);
    if (existing) return existing;
    const run = this.generateImageDescription(assetId).finally(() =>
      this.pendingDescriptions.delete(assetId)
    );
    this.pendingDescriptions.set(assetId, run);
    return run;
  }

  /**
   * Describe a freshly uploaded or rendered image in the background. Never
   * throws and never blocks the upload or render that called it. Skipped while
   * the VLM is not installed; adaptation captions such an image on demand
   * later.
   */
  describeAssetLater(assetId: string): void {
    void runBackgroundTask(`Image description ${assetId}`, async () => {
      if (!(await this.status()).ready) return;
      await this.describeImageAsset(assetId);
    });
  }

  async autoPrompt(
    input: LocalAutoPromptInput
  ): Promise<LocalAutoPromptResult> {
    const style = this.decodeImage(input.styleReferenceImage);
    if (!style) throw new Error("styleReferenceImage is required");

    // Same preconditions the cloud endpoint enforces, checked
    // here so a bad call fails fast instead of after a minute of inference.
    if (input.version === "img2img_mago") {
      const source = this.decodeImage(input.sourceVideoFrame);
      if (!source)
        throw new Error("sourceVideoFrame is required for img2img_mago");
      // Order matters: the template calls the video frame "Image 1" and the
      // style reference "Image 2".
      return {
        positive_prompt: await this.generatePositive({
          userPrompt: AUTO_PROMPT_IMG2IMG,
          images: [source, style],
          maxTokens: AUTO_PROMPT_MAX_TOKENS
        })
      };
    }

    const motionDescription = input.motionDescription?.trim();
    if (!motionDescription)
      throw new Error("motionDescription is required for video2video_default");
    return {
      positive_prompt: await this.generatePositive({
        userPrompt: `${AUTO_PROMPT_VIDEO2VIDEO}\n\nMotion description: ${motionDescription}`,
        images: [style],
        maxTokens: AUTO_PROMPT_MAX_TOKENS
      })
    };
  }

  async saveAutoPrompt(
    input: LocalAutoPromptSaveInput
  ): Promise<LocalAsset | null> {
    const positivePrompt = input.positivePrompt.trim();
    if (!positivePrompt)
      throw new Error("positive_prompt must be a non-empty string");
    return this.repository.appendAssetAutoPrompt(input.assetId, {
      video_asset_id: input.videoAssetId,
      version: input.version,
      positive_prompt: positivePrompt
    });
  }

  async enhancePrompt(
    input: LocalEnhancePromptInput
  ): Promise<LocalEnhancePromptResult> {
    const query = input.query?.trim();
    if (!query) throw new Error("Missing required 'query' field");
    // Text only — the enhancer never had an image, and only the kontext version
    // ever shipped.
    const text = await this.generate({
      userPrompt: `${PROMPT_ENHANCER_KONTEXT}\n\nUser prompt: ${query}`,
      maxTokens: ENHANCE_MAX_TOKENS
    });
    return { enhanced_prompt: text };
  }

  private async generateImageDescription(
    assetId: string
  ): Promise<string | null> {
    const asset = await this.repository.getAsset(assetId);
    if (!asset || asset.type !== "IMAGE") return null;
    if ("description" in asset.data) return storedDescription(asset);

    const sourcePath = await this.repository.assetSourcePath(assetId);
    if (!sourcePath) return null;
    const description = await this.generate({
      userPrompt: IMAGE_DESCRIPTION_PROMPT,
      images: [await this.loadImage(sourcePath)],
      maxTokens: DESCRIPTION_MAX_TOKENS,
      temperature: 0.1
    });
    if (!description) throw new Error("Qwen3-VL returned an empty description");
    // Whatever landed first wins: a user edit made while Qwen was running is
    // kept, and that is what the caller gets back.
    const updated = await this.repository.setAssetDescriptionIfAbsent(
      assetId,
      description
    );
    return updated ? storedDescription(updated) : description;
  }

  private async generateAssetPrompt(
    assetId: string
  ): Promise<LocalAssetPromptResult> {
    const asset = await this.repository.getAsset(assetId);
    if (!asset) throw new Error("Local asset not found");

    const cached = readCachedPrompt(asset.data.prompt);
    if (cached) return { prompt: cached };

    const prompt =
      asset.type === "IMAGE"
        ? await this.captionImage(assetId)
        : await this.captionVideo(assetId, asset);

    await this.repository.setAssetPrompt(
      assetId,
      prompt as unknown as Record<string, unknown>
    );
    return { prompt };
  }

  private async captionImage(assetId: string): Promise<StructuredPrompt> {
    const sourcePath = await this.repository.assetSourcePath(assetId);
    if (!sourcePath) throw new Error("Asset file is unavailable");
    const image = await this.loadImage(sourcePath);
    return this.generateStructured({
      userPrompt: STYLE_REFERENCE_PROMPT,
      images: [image],
      maxTokens: CAPTION_MAX_TOKENS
    });
  }

  private async captionVideo(
    assetId: string,
    asset: LocalAsset
  ): Promise<StructuredPrompt> {
    const sourcePath = await this.repository.assetSourcePath(assetId);
    if (!sourcePath) throw new Error("Asset file is unavailable");
    const totalFrames = Number(asset.data.total_frames) || 0;
    if (totalFrames < 1)
      throw new Error("Video asset has no frame count to sample from");
    const { firstFrame, grids } = await extractVideoCaptionFrames({
      sourcePath,
      totalFrames
    });
    return this.generateStructured({
      userPrompt: VIDEO_DESCRIPTION_PROMPT,
      images: [firstFrame, ...grids],
      maxTokens: CAPTION_MAX_TOKENS
    });
  }

  private async generateStructured(
    request: GenerateRequest
  ): Promise<StructuredPrompt> {
    const { parsed } = await this.generateParsed(request, (text) =>
      toStructuredPrompt(extractJsonObject(text))
    );
    if (!parsed)
      throw new Error("Qwen3-VL did not return the expected JSON structure");
    return parsed;
  }

  private async generatePositive(request: GenerateRequest): Promise<string> {
    const { parsed, text } = await this.generateParsed(request, (value) =>
      toPositivePrompt(extractJsonObject(value))
    );
    // Fall back to the raw text: the AutoPrompt templates ask for
    // {"positive": "..."}, but a bare sentence is still a usable prompt and
    // beats handing the user nothing.
    return parsed ?? text;
  }

  /**
   * One generation, plus a single deterministic retry when the output can't be
   * parsed. A 2B model drifts off-format far more often than gemini-2.5-flash
   * did; temperature 0 with a blunter instruction usually snaps it back.
   */
  private async generateParsed<T>(
    request: GenerateRequest,
    parse: (text: string) => T | null
  ): Promise<{ parsed: T | null; text: string }> {
    const text = await this.generate(request);
    const parsed = parse(text);
    if (parsed !== null) return { parsed, text };

    const retryText = await this.generate({
      ...request,
      userPrompt: `${request.userPrompt}\n\nRespond with the JSON object only. No prose, no code fence.`,
      temperature: 0
    });
    return { parsed: parse(retryText), text: retryText };
  }

  /** One VLM job in ComfyUI's queue at a time — see `queue`. */
  private async generate(request: GenerateRequest): Promise<string> {
    const task = this.queue.then(async () => {
      const [endpoint, backend] = await Promise.all([
        this.settings.getComfyEndpoint(),
        this.settings.getVlmBackend()
      ]);
      const client = new ComfyVlmClient(endpoint, backend);
      return (
        await client.generate({ systemPrompt: SYSTEM_PROMPT, ...request })
      ).trim();
    });
    // Keep the chain alive after a failed job.
    this.queue = task.then(
      () => undefined,
      () => undefined
    );
    return task;
  }

  private async loadImage(sourcePath: string): Promise<Buffer> {
    return this.resize(await readFile(sourcePath));
  }

  /** Decode a data URI (or bare base64) as the renderer sends it. Returns null
   *  only when the value is absent or empty — a present-but-undecodable image
   *  throws, so the caller doesn't report it as "missing". */
  private decodeImage(value: string | undefined): Buffer | null {
    if (!value) return null;
    const base64 = value.includes(",") ? value.split(",", 2)[1]! : value;
    const bytes = Buffer.from(base64, "base64");
    return bytes.length ? this.resize(bytes) : null;
  }

  /** Downscale to IMAGE_MAX_DIMENSION and normalise to PNG. */
  private resize(bytes: Buffer): Buffer {
    const image = nativeImage.createFromBuffer(bytes);
    if (image.isEmpty()) throw new Error("Could not decode the image");
    const { width, height } = image.getSize();
    const longest = Math.max(width, height);
    const scaled =
      longest > IMAGE_MAX_DIMENSION
        ? image.resize(
            width >= height
              ? { width: IMAGE_MAX_DIMENSION }
              : { height: IMAGE_MAX_DIMENSION }
          )
        : image;
    return scaled.toPNG();
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : "Qwen3-VL is unavailable";
  }
}
