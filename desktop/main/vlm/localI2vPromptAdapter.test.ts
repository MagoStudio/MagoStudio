import { describe, expect, it, vi } from "vitest";

import type { LocalAsset } from "../../shared/contracts";

import { LocalI2vPromptAdapter } from "./localI2vPromptAdapter";

const asset = (
  id: string,
  type: "IMAGE" | "VIDEO",
  data: Record<string, unknown> = {}
): LocalAsset => ({ id, name: id, filepath: "", type, data });

const DOCUMENT = {
  subject_definitions: "<Subject 1> is the woman in <Picture 1>.",
  summary: "[reference generation] <Subject 1> walks.",
  retention_analysis: "<Subject 1>: fully_preserved - her coat.",
  detailed_description: "[Shot 1] <Subject 1> walks.",
  overall_soundscape: "Footsteps.",
  non_diegetic_music: "N/A"
};

const setup = (assets: LocalAsset[]) => {
  const byId = new Map(assets.map((item) => [item.id, item]));
  const dependencies = {
    getAsset: vi.fn(async (id: string) => byId.get(id) ?? null),
    describeImage: vi.fn(async () => "a freshly captioned image"),
    captionVideo: vi.fn(async () => ({
      positive: {
        content: "a dancer spins",
        setting: "on a rooftop",
        style: "film",
        references: ""
      },
      negative: ""
    })),
    runTextPrompt: vi.fn(async () => JSON.stringify(DOCUMENT))
  };
  return { adapter: new LocalI2vPromptAdapter(dependencies), dependencies };
};

const inventoryOf = async (
  adapter: LocalI2vPromptAdapter,
  ids: string[]
): Promise<string> =>
  (await adapter.adapt({ prompt: "she walks", reference_asset_ids: ids }))
    .reference_inventory ?? "";

describe("LocalI2vPromptAdapter", () => {
  it("prefers the stored description, then a mirrored i2v caption", async () => {
    const { adapter, dependencies } = setup([
      asset("a", "IMAGE", { description: "a woman in a red coat" }),
      asset("b", "IMAGE", { i2v_caption: "a rainy street" })
    ]);
    const inventory = await inventoryOf(adapter, ["a", "b"]);
    expect(inventory).toContain("IMAGE_1: a woman in a red coat");
    expect(inventory).toContain("IMAGE_2: a rainy street");
    expect(dependencies.describeImage).not.toHaveBeenCalled();
  });

  it("captions an image that predates captioning, on demand", async () => {
    const { adapter, dependencies } = setup([asset("old", "IMAGE")]);
    expect(await inventoryOf(adapter, ["old"])).toContain(
      "IMAGE_1: a freshly captioned image"
    );
    expect(dependencies.describeImage).toHaveBeenCalledWith("old");
  });

  it("does not re-caption an image whose description was cleared", async () => {
    const { adapter, dependencies } = setup([
      asset("cleared", "IMAGE", { description: "" })
    ]);
    expect(await inventoryOf(adapter, ["cleared"])).toContain(
      "IMAGE_1: an image whose contents could not be described"
    );
    expect(dependencies.describeImage).not.toHaveBeenCalled();
  });

  it("reads a video's cached caption, and captions it when there is none", async () => {
    const { adapter, dependencies } = setup([
      asset("cached", "VIDEO", {
        prompt: { positive: { content: "a car", setting: "at night" } }
      }),
      asset("fresh", "VIDEO")
    ]);
    const inventory = await inventoryOf(adapter, ["cached", "fresh"]);
    expect(inventory).toContain("VIDEO_1: a car at night");
    expect(inventory).toContain("VIDEO_2: a dancer spins on a rooftop");
    expect(dependencies.captionVideo).toHaveBeenCalledTimes(1);
  });

  it("degrades a failed caption to the generic description", async () => {
    const { adapter, dependencies } = setup([asset("old", "IMAGE")]);
    dependencies.describeImage.mockRejectedValue(new Error("VLM missing"));
    expect(await inventoryOf(adapter, ["old"])).toContain(
      "IMAGE_1: an image whose contents could not be described"
    );
  });

  it("numbers audio in its own slot family, from its stored caption only", async () => {
    const { adapter, dependencies } = setup([
      asset("clip", "VIDEO", { i2v_caption: "a street at night" }),
      asset("song", "AUDIO" as "VIDEO", { i2v_caption: "a slow piano piece" }),
      asset("silent", "AUDIO" as "VIDEO")
    ]);
    const inventory = await inventoryOf(adapter, ["clip", "song", "silent"]);
    expect(inventory).toContain("VIDEO_1: a street at night");
    expect(inventory).not.toContain("VIDEO_2");
    expect(inventory).toContain("AUDIO_1: a slow piano piece");
    expect(inventory).toContain(
      "AUDIO_2: an audio clip whose contents could not be described"
    );
    expect(dependencies.captionVideo).not.toHaveBeenCalled();
  });

  it("refuses an asset type that cannot be a reference rather than guessing", async () => {
    const { adapter, dependencies } = setup([
      asset("list", "IMAGE_LIST" as "IMAGE")
    ]);
    await expect(
      adapter.adapt({ prompt: "she walks", reference_asset_ids: ["list"] })
    ).rejects.toThrow(
      "reference asset list is a IMAGE_LIST, which cannot be a reference"
    );
    expect(dependencies.runTextPrompt).not.toHaveBeenCalled();
  });

  it("rejects a reference that is not in the library", async () => {
    const { adapter } = setup([]);
    await expect(
      adapter.adapt({ prompt: "she walks", reference_asset_ids: ["gone"] })
    ).rejects.toThrow("reference asset gone not found");
  });
});
