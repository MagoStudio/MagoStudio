import { SourceImage } from "@domains/renders/types";
import { describe, expect, it } from "vitest";

import { happyHorse1Model } from "./happyHorse1Model";
import { klingO1Model } from "./klingO1Model";
import { klingO3EditProModel } from "./klingO3EditProModel";
import { seedance2Model } from "./seedance2Model";
import { flattenSettingsGroups } from "./utils/flattenSettingsGroups";

const API_PROMPT_MODELS = [
  { displayName: "Kling O1 Pro", model: klingO1Model },
  { displayName: "Kling O3 Edit Pro", model: klingO3EditProModel },
  { displayName: "Seedance 2.0", model: seedance2Model },
  { displayName: "Happy Horse 1.0", model: happyHorse1Model }
];

const getPromptValidation = (
  model: (typeof API_PROMPT_MODELS)[number]["model"]
) => {
  const validate = flattenSettingsGroups(model)
    .flatMap((section) => section.settings)
    .find((setting) => setting.key === "prompt")!.customValidation!;

  return (value: string | undefined, sources: SourceImage[]) =>
    validate(value, {}, sources);
};

const sourcesFromImageIds = (imageIds: string[]): SourceImage[] =>
  imageIds.map((assetId) => ({ asset_id: assetId, type: "reference_frame" }));

const sourcesFromElementPair = (
  referenceAssetId?: string,
  frontalAssetId?: string
): SourceImage[] => [
  ...(referenceAssetId
    ? [
        {
          asset_id: referenceAssetId,
          type: "element_reference" as const,
          index: 0
        }
      ]
    : []),
  ...(frontalAssetId
    ? [{ asset_id: frontalAssetId, type: "element_frontal" as const, index: 0 }]
    : [])
];

describe("API prompt models render the unified Prompt UI with AutoPrompt hidden and doubled height", () => {
  it.each(API_PROMPT_MODELS)(
    "$displayName: prompt setting uses ui:Prompt with hideAutoPrompt and doubleHeight",
    ({ model }) => {
      const promptSetting = flattenSettingsGroups(model)
        .flatMap((section) => section.settings)
        .find((setting) => setting.key === "prompt")!;

      expect(promptSetting.ui).toBe("Prompt");
      expect(promptSetting.specificConfig?.hideAutoPrompt).toBe(true);
      expect(promptSetting.specificConfig?.doubleHeight).toBe(true);
      expect(promptSetting.specificConfig?.availableTags).toBeUndefined();
    }
  );
});

describe("API prompt models validate tags and images bidirectionally", () => {
  it.each(API_PROMPT_MODELS)(
    "$displayName: flags a filled image that the prompt never references",
    ({ model }) => {
      const validate = getPromptValidation(model);

      expect(
        validate("a cat riding a bike", sourcesFromImageIds(["img-1"]))
      ).toBe("Add @Image1 to your prompt or remove the image");
    }
  );

  it.each(API_PROMPT_MODELS)(
    "$displayName: flags a filled second image that the prompt never references",
    ({ model }) => {
      const validate = getPromptValidation(model);

      expect(
        validate("a cat @Image1", sourcesFromImageIds(["img-1", "img-2"]))
      ).toBe("Add @Image2 to your prompt or remove the image");
    }
  );

  it.each(API_PROMPT_MODELS)(
    "$displayName: accepts a prompt that references every filled image",
    ({ model }) => {
      const validate = getPromptValidation(model);

      expect(
        validate(
          "a cat @Image1 and @image2",
          sourcesFromImageIds(["img-1", "img-2"])
        )
      ).toBe(null);
    }
  );

  it.each(API_PROMPT_MODELS)(
    "$displayName: does not flag anything when no image is uploaded",
    ({ model }) => {
      const validate = getPromptValidation(model);

      expect(validate("a cat riding a bike", sourcesFromImageIds([]))).toBe(
        null
      );
      expect(validate("a cat riding a bike", [])).toBe(null);
    }
  );

  it.each(API_PROMPT_MODELS)(
    "$displayName: still flags a referenced tag whose image is missing",
    ({ model }) => {
      const validate = getPromptValidation(model);

      expect(validate("a cat @Image1", sourcesFromImageIds([]))).toBe(
        "Please add @Image1 or remove it from your prompt"
      );
    }
  );

  it.each(API_PROMPT_MODELS)(
    "$displayName: ignores an empty prompt",
    ({ model }) => {
      const validate = getPromptValidation(model);

      expect(validate("", sourcesFromImageIds(["img-1"]))).toBe(null);
      expect(validate(undefined, sourcesFromImageIds(["img-1"]))).toBe(null);
    }
  );
});

describe("Kling models validate the @Element1 pair bidirectionally", () => {
  const KLING_MODELS = [
    { displayName: "Kling O1 Pro", model: klingO1Model },
    { displayName: "Kling O3 Edit Pro", model: klingO3EditProModel }
  ];

  it.each(KLING_MODELS)(
    "$displayName: flags both element images set without @Element1 in the prompt",
    ({ model }) => {
      const validate = getPromptValidation(model);

      expect(
        validate(
          "a cat riding a bike",
          sourcesFromElementPair("ref-1", "front-1")
        )
      ).toBe("Add @Element1 to your prompt or remove the element images");
    }
  );

  it.each(KLING_MODELS)(
    "$displayName: does not flag when only one element image is set",
    ({ model }) => {
      const validate = getPromptValidation(model);

      expect(
        validate("a cat riding a bike", sourcesFromElementPair("ref-1"))
      ).toBe(null);
      expect(
        validate(
          "a cat riding a bike",
          sourcesFromElementPair(undefined, "front-1")
        )
      ).toBe(null);
    }
  );

  it.each(KLING_MODELS)(
    "$displayName: accepts both element images set with @Element1 referenced",
    ({ model }) => {
      const validate = getPromptValidation(model);

      expect(
        validate("a cat @Element1", sourcesFromElementPair("ref-1", "front-1"))
      ).toBe(null);
    }
  );

  it.each(KLING_MODELS)(
    "$displayName: still flags @Element1 referenced without both images",
    ({ model }) => {
      const validate = getPromptValidation(model);

      expect(validate("a cat @Element1", sourcesFromElementPair("ref-1"))).toBe(
        "Please add @Element1 images or remove it from your prompt"
      );
    }
  );
});
