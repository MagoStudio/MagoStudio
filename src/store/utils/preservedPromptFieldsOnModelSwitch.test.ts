import { minimaxReferenceVideoModel } from "@models/video/minimaxReferenceVideoModel";
import { seedance2Model } from "@models/video/seedance2Model";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { preservedPromptFieldsOnModelSwitch } from "./preservedPromptFieldsOnModelSwitch";

const buildModel = (overwritesPromptOnSelect?: boolean): VideoModelDefinition =>
  ({
    capabilities: { overwritesPromptOnSelect },
    settingsGroups: [
      {
        sections: [
          {
            settings: [{ key: "prompt" }, { key: "negative_prompt" }]
          }
        ]
      }
    ]
  }) as unknown as VideoModelDefinition;

const buildModelDeclaringNoPromptFields = (): VideoModelDefinition =>
  ({
    capabilities: {},
    settingsGroups: [{ sections: [{ settings: [{ key: "seed" }] }] }]
  }) as unknown as VideoModelDefinition;

describe("preservedPromptFieldsOnModelSwitch", () => {
  it("drops the prompt when the incoming model declares overwritesPromptOnSelect", () => {
    const previousValues: VideoSettings = {
      prompt: "a cat riding a bike",
      negative_prompt: "blurry"
    };

    const preserved = preservedPromptFieldsOnModelSwitch(
      buildModel(true),
      previousValues
    );

    expect(preserved.prompt).toBeUndefined();
  });

  it("keeps the prompt when the incoming model does not declare overwritesPromptOnSelect", () => {
    const previousValues: VideoSettings = {
      prompt: "a cat riding a bike",
      negative_prompt: "blurry"
    };

    const preserved = preservedPromptFieldsOnModelSwitch(
      buildModel(false),
      previousValues
    );

    expect(preserved.prompt).toBe("a cat riding a bike");
  });

  it("preserves the negative prompt regardless of the incoming model's declaration", () => {
    const previousValues: VideoSettings = {
      prompt: "a cat riding a bike",
      negative_prompt: "blurry"
    };

    const preserved = preservedPromptFieldsOnModelSwitch(
      buildModel(true),
      previousValues
    );

    expect(preserved.negative_prompt).toBe("blurry");
  });

  it("keeps the prompt when the incoming model's capabilities omit overwritesPromptOnSelect entirely", () => {
    const previousValues: VideoSettings = {
      prompt: "a cat riding a bike",
      negative_prompt: "blurry"
    };

    const modelWithNoDeclaration = buildModel(undefined);

    const preserved = preservedPromptFieldsOnModelSwitch(
      modelWithNoDeclaration,
      previousValues
    );

    expect(preserved.prompt).toBe("a cat riding a bike");
  });

  it("keeps the prompt when switching to a real shipped model that does not declare overwritesPromptOnSelect (e.g. Seedance 2.0)", () => {
    const previousValues: VideoSettings = {
      prompt: "a cat riding a bike",
      negative_prompt: "blurry"
    };

    const preserved = preservedPromptFieldsOnModelSwitch(
      seedance2Model,
      previousValues
    );

    expect(preserved.prompt).toBe("a cat riding a bike");
  });

  it("does not preserve an empty prompt even when the incoming model preserves prompts", () => {
    const previousValues: VideoSettings = {
      prompt: "",
      negative_prompt: ""
    };

    const preserved = preservedPromptFieldsOnModelSwitch(
      buildModel(false),
      previousValues
    );

    expect(preserved.prompt).toBeUndefined();
    expect(preserved.negative_prompt).toBeUndefined();
  });

  it("drops a prompt field the incoming model does not declare, so it cannot reach that engine", () => {
    const previousValues: VideoSettings = {
      prompt: "a cat riding a bike",
      negative_prompt: "blurry"
    };

    const preserved = preservedPromptFieldsOnModelSwitch(
      buildModelDeclaringNoPromptFields(),
      previousValues
    );

    expect(preserved.prompt).toBeUndefined();
    expect(preserved.negative_prompt).toBeUndefined();
  });

  it("drops negative_prompt when switching to MiniMax Reference, which does not declare it", () => {
    const previousValues: VideoSettings = {
      prompt: "a cat riding a bike",
      negative_prompt: "blurry"
    };

    const preserved = preservedPromptFieldsOnModelSwitch(
      minimaxReferenceVideoModel,
      previousValues
    );

    expect(preserved.prompt).toBe("a cat riding a bike");
    expect(preserved.negative_prompt).toBeUndefined();
  });
});
