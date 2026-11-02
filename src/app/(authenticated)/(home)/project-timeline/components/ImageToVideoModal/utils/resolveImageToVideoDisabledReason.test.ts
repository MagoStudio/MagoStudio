import { describe, expect, test } from "vitest";

import { resolveImageToVideoDisabledReason } from "./resolveImageToVideoDisabledReason";

const MISSING_PROJECT_MESSAGE = "Select a project to generate a video.";
const MODEL_NOT_ALLOWED_MESSAGE = "This model isn't available in this mode.";

describe("resolveImageToVideoDisabledReason", () => {
  test("returns undefined when nothing is blocking generation", () => {
    expect(
      resolveImageToVideoDisabledReason({
        hasSelectedProject: true,
        validationErrorMessage: undefined,
        isModelNotAllowedInMode: false,
        missingProjectMessage: MISSING_PROJECT_MESSAGE,
        modelNotAllowedInModeMessage: MODEL_NOT_ALLOWED_MESSAGE
      })
    ).toBeUndefined();
  });

  test("returns the missing-project message when no project is selected", () => {
    expect(
      resolveImageToVideoDisabledReason({
        hasSelectedProject: false,
        validationErrorMessage: undefined,
        isModelNotAllowedInMode: false,
        missingProjectMessage: MISSING_PROJECT_MESSAGE,
        modelNotAllowedInModeMessage: MODEL_NOT_ALLOWED_MESSAGE
      })
    ).toBe(MISSING_PROJECT_MESSAGE);
  });

  test("returns the validation error message when the form is invalid", () => {
    expect(
      resolveImageToVideoDisabledReason({
        hasSelectedProject: true,
        validationErrorMessage: "You need to add a prompt",
        isModelNotAllowedInMode: false,
        missingProjectMessage: MISSING_PROJECT_MESSAGE,
        modelNotAllowedInModeMessage: MODEL_NOT_ALLOWED_MESSAGE
      })
    ).toBe("You need to add a prompt");
  });

  test("returns the mode-restriction message when the model isn't allowed in the active mode", () => {
    expect(
      resolveImageToVideoDisabledReason({
        hasSelectedProject: true,
        validationErrorMessage: undefined,
        isModelNotAllowedInMode: true,
        missingProjectMessage: MISSING_PROJECT_MESSAGE,
        modelNotAllowedInModeMessage: MODEL_NOT_ALLOWED_MESSAGE
      })
    ).toBe(MODEL_NOT_ALLOWED_MESSAGE);
  });

  test("prioritizes the missing-project reason over everything else", () => {
    expect(
      resolveImageToVideoDisabledReason({
        hasSelectedProject: false,
        validationErrorMessage: "You need to add a prompt",
        isModelNotAllowedInMode: true,
        missingProjectMessage: MISSING_PROJECT_MESSAGE,
        modelNotAllowedInModeMessage: MODEL_NOT_ALLOWED_MESSAGE
      })
    ).toBe(MISSING_PROJECT_MESSAGE);
  });

  test("prioritizes the validation error over the mode restriction", () => {
    expect(
      resolveImageToVideoDisabledReason({
        hasSelectedProject: true,
        validationErrorMessage: "You need to add a start image",
        isModelNotAllowedInMode: true,
        missingProjectMessage: MISSING_PROJECT_MESSAGE,
        modelNotAllowedInModeMessage: MODEL_NOT_ALLOWED_MESSAGE
      })
    ).toBe("You need to add a start image");
  });
});
