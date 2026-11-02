import { describe, expect, test } from "vitest";

import { resolveQuestionnaireResumeStep } from "./resolveQuestionnaireResumeStep";

describe("resolveQuestionnaireResumeStep", () => {
  test("keeps the questionnaire step when it has not been completed", () => {
    expect(
      resolveQuestionnaireResumeStep({
        step: "questionnaire",
        questionnaireCompleted: false
      })
    ).toBe("questionnaire");
  });

  test("skips the questionnaire to upload once completed", () => {
    expect(
      resolveQuestionnaireResumeStep({
        step: "questionnaire",
        questionnaireCompleted: true
      })
    ).toBe("upload");
  });

  test("leaves non-questionnaire steps untouched regardless of the flag", () => {
    expect(
      resolveQuestionnaireResumeStep({
        step: "upload",
        questionnaireCompleted: true
      })
    ).toBe("upload");
    expect(
      resolveQuestionnaireResumeStep({
        step: "complete",
        questionnaireCompleted: false
      })
    ).toBe("complete");
  });
});
