import { describe, expect, test } from "vitest";

import { QuestionnaireAnswers } from "../questionnaire";

import { buildQuestionnaireMetadataUpdate } from "./buildQuestionnaireMetadataUpdate";

const answers: QuestionnaireAnswers = {
  firstName: "Ada",
  lastName: "Lovelace",
  profession: "vfx",
  referralSource: "instagram"
};

describe("buildQuestionnaireMetadataUpdate", () => {
  test("maps names to native fields and answers to its own unsafeMetadata keys with the completion flag", () => {
    expect(buildQuestionnaireMetadataUpdate(answers)).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      unsafeMetadata: {
        profession: "vfx",
        referralSource: "instagram",
        signupQuestionnaireCompleted: true
      }
    });
  });

  test("emits only its own keys so Clerk deep-merge preserves the rest", () => {
    const result = buildQuestionnaireMetadataUpdate(answers);

    expect(result.unsafeMetadata).not.toHaveProperty("referral_id");
    expect(result.unsafeMetadata).not.toHaveProperty(
      "google_analytics_user_id"
    );
    expect(Object.keys(result.unsafeMetadata)).toEqual([
      "profession",
      "referralSource",
      "signupQuestionnaireCompleted"
    ]);
  });

  test("includes professionOther after profession when the free-text 'Other' job is provided", () => {
    const result = buildQuestionnaireMetadataUpdate({
      ...answers,
      profession: "other",
      professionOther: "Puppeteer"
    });

    expect(result.unsafeMetadata).toMatchObject({
      profession: "other",
      professionOther: "Puppeteer"
    });
    expect(Object.keys(result.unsafeMetadata)).toEqual([
      "profession",
      "professionOther",
      "referralSource",
      "signupQuestionnaireCompleted"
    ]);
  });

  test("omits professionOther entirely when no free-text job is provided", () => {
    const result = buildQuestionnaireMetadataUpdate(answers);

    expect(result.unsafeMetadata).not.toHaveProperty("professionOther");
  });

  test("trims surrounding whitespace from names", () => {
    const result = buildQuestionnaireMetadataUpdate({
      ...answers,
      firstName: "  Ada  ",
      lastName: " Lovelace "
    });

    expect(result.firstName).toBe("Ada");
    expect(result.lastName).toBe("Lovelace");
  });
});
