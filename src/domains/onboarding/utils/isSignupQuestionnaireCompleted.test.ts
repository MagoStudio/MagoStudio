import { describe, expect, test } from "vitest";

import { isSignupQuestionnaireCompleted } from "./isSignupQuestionnaireCompleted";

describe("isSignupQuestionnaireCompleted", () => {
  test("is true when the flag is set", () => {
    expect(
      isSignupQuestionnaireCompleted({ signupQuestionnaireCompleted: true })
    ).toBe(true);
  });

  test("is false when the flag is missing", () => {
    expect(isSignupQuestionnaireCompleted({ referral_id: "abc" })).toBe(false);
  });

  test("is false for empty, null, or undefined metadata", () => {
    expect(isSignupQuestionnaireCompleted({})).toBe(false);
    expect(isSignupQuestionnaireCompleted(null)).toBe(false);
    expect(isSignupQuestionnaireCompleted(undefined)).toBe(false);
  });

  test("is false when the flag is falsy", () => {
    expect(
      isSignupQuestionnaireCompleted({ signupQuestionnaireCompleted: false })
    ).toBe(false);
  });
});
