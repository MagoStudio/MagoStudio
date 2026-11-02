import { SIGNUP_QUESTIONNAIRE_COMPLETED_KEY } from "../questionnaire";

export const isSignupQuestionnaireCompleted = (
  unsafeMetadata: unknown
): boolean =>
  Boolean(
    (unsafeMetadata as Record<string, unknown> | null | undefined)?.[
      SIGNUP_QUESTIONNAIRE_COMPLETED_KEY
    ]
  );
