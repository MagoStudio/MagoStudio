import type {
  LocalAdaptI2vPromptInput,
  LocalAdaptI2vPromptResult,
  LocalAsset,
  LocalAssetPrompt
} from "../../shared/contracts";

import {
  adaptI2vPrompt,
  UNKNOWN_REFERENCE,
  type DescribedReferences,
  type ReferenceKind,
  type RunTextPrompt
} from "./i2vPromptAdaptation";
import { readCachedPrompt } from "./promptJson";

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

/** i2v_prompt.py `_KIND_BY_MEDIA_TYPE`: the asset type decides the slot family,
 *  so an unrecognised type is refused rather than guessed — a guess would take
 *  a slot and shift the numbering of every later reference of that kind. */
const KIND_BY_ASSET_TYPE: Record<string, ReferenceKind> = {
  IMAGE: "image",
  VIDEO: "video",
  RENDER: "video",
  AUDIO: "audio"
};

/** A video's structured caption, read as prose for the inventory. */
const videoPromptText = (prompt: LocalAssetPrompt | null): string | null =>
  prompt
    ? text(
        [prompt.positive.content, prompt.positive.setting]
          .filter(Boolean)
          .join(" ")
      )
    : null;

/** A caption some other writer already stored (a cloud-mirrored asset's
 *  `i2v_caption`, or a plain-text `prompt`). Audio is only ever read this way:
 *  the backend never captions audio on demand either. */
const storedCaption = (asset: LocalAsset): string | null =>
  text(asset.data.i2v_caption) ?? text(asset.data.prompt);

/**
 * The local `POST /adapt_i2v_prompt`: the same request and response, with the
 * references read from the local library and the rewrite run on the local
 * script text model (Qwen3.8) instead of Gemini.
 */
export class LocalI2vPromptAdapter {
  constructor(
    private readonly dependencies: {
      getAsset: (assetId: string) => Promise<LocalAsset | null>;
      /** Fills and returns an image's `description`, captioning it if absent. */
      describeImage: (assetId: string) => Promise<string | null>;
      /** Returns a video's structured caption, generating it if absent. */
      captionVideo: (assetId: string) => Promise<LocalAssetPrompt | null>;
      runTextPrompt: RunTextPrompt;
    }
  ) {}

  async adapt(
    input: LocalAdaptI2vPromptInput
  ): Promise<LocalAdaptI2vPromptResult> {
    const userPrompt = input.prompt.trim();
    if (!userPrompt) throw new Error("prompt is required");
    return adaptI2vPrompt({
      userPrompt,
      described: await this.describeReferences(input.reference_asset_ids ?? []),
      engine: input.engine,
      durationSeconds: input.duration_s,
      aspect: input.aspect,
      run: this.dependencies.runTextPrompt
    });
  }

  /**
   * i2v_prompt.py `describe_references`: per-kind descriptions in the caller's
   * order, which is what decides the slot numbers.
   */
  private async describeReferences(
    assetIds: string[]
  ): Promise<DescribedReferences> {
    const described: DescribedReferences = { image: [], video: [], audio: [] };
    for (const assetId of assetIds) {
      const asset = await this.dependencies.getAsset(assetId);
      if (!asset) throw new Error(`reference asset ${assetId} not found`);
      const kind =
        typeof asset.type === "string"
          ? KIND_BY_ASSET_TYPE[asset.type]
          : undefined;
      if (!kind)
        throw new Error(
          `reference asset ${assetId} is a ${String(asset.type)}, which cannot be a reference`
        );
      const description =
        kind === "image"
          ? await this.describeImage(asset)
          : kind === "video"
            ? await this.describeVideo(asset)
            : storedCaption(asset);
      described[kind].push(description ?? UNKNOWN_REFERENCE[kind]);
    }
    return described;
  }

  /**
   * The image's own `description` (filled when it was uploaded or rendered),
   * then a cloud-mirrored `i2v_caption`, then a caption made now — which is how
   * an image that predates captioning gets one. A failed caption degrades to
   * the generic description rather than failing the whole adaptation.
   */
  private async describeImage(asset: LocalAsset): Promise<string | null> {
    const existing =
      text(asset.data.description) ?? text(asset.data.i2v_caption);
    if (existing || "description" in asset.data) return existing;
    try {
      return text(await this.dependencies.describeImage(asset.id));
    } catch {
      return null;
    }
  }

  /**
   * The cloud reads a video's stored ingestion caption and never captions one
   * on demand — but every cloud upload has one, and a local video does not
   * until it is asked for. Generating it here (it is cached on the asset, and
   * the AutoPrompt flow reads the same one) is what keeps the source video from
   * reaching the model as "a video clip whose contents could not be described".
   */
  private async describeVideo(asset: LocalAsset): Promise<string | null> {
    const existing =
      text(asset.data.i2v_caption) ??
      videoPromptText(readCachedPrompt(asset.data.prompt));
    if (existing) return existing;
    try {
      return videoPromptText(await this.dependencies.captionVideo(asset.id));
    } catch {
      return null;
    }
  }
}
