import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { seedance2I2vModel } from "@models/video/seedance2I2vModel";
import { VideoSettings } from "@models/video/types";
import { describe, expect, test } from "vitest";

import { getImageToVideoValidationErrorMessage } from "./getImageToVideoValidationErrorMessage";

describe("getImageToVideoValidationErrorMessage", () => {
  const baseValues = extractDefaultVideoSettings(
    seedance2I2vModel
  ) as VideoSettings;

  test("passes with a prompt, a start image and a valid duration", () => {
    const values: VideoSettings = {
      ...baseValues,
      prompt: "A cat walking",
      image_id: "asset-1"
    };
    expect(
      getImageToVideoValidationErrorMessage(seedance2I2vModel, values)
    ).toBeUndefined();
  });

  test("fails without a prompt", () => {
    const values: VideoSettings = {
      ...baseValues,
      prompt: "",
      image_id: "asset-1"
    };
    expect(
      getImageToVideoValidationErrorMessage(seedance2I2vModel, values)
    ).toBe("You need to add a prompt");
  });

  test("fails without a start image", () => {
    const values: VideoSettings = {
      ...baseValues,
      prompt: "A cat walking",
      image_id: undefined
    };
    expect(
      getImageToVideoValidationErrorMessage(seedance2I2vModel, values)
    ).toBe("You need to add a start image");
  });

  test("fails when duration is outside the 4-15 second range", () => {
    const values: VideoSettings = {
      ...baseValues,
      prompt: "A cat walking",
      image_id: "asset-1",
      durationInSeconds: 16
    };
    expect(
      getImageToVideoValidationErrorMessage(seedance2I2vModel, values)
    ).toBe("Duration must be between 4 and 15 seconds");
  });
});
