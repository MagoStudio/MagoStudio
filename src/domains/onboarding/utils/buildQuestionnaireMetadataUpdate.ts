import {
  QuestionnaireAnswers,
  SIGNUP_QUESTIONNAIRE_COMPLETED_KEY
} from "../questionnaire";

export interface QuestionnaireMetadataUpdate {
  firstName: string;
  lastName: string;
  unsafeMetadata: Record<string, unknown>;
}

export const buildQuestionnaireMetadataUpdate = (
  answers: QuestionnaireAnswers
): QuestionnaireMetadataUpdate => ({
  firstName: answers.firstName.trim(),
  lastName: answers.lastName.trim(),
  unsafeMetadata: {
    profession: answers.profession,
    ...(answers.professionOther
      ? { professionOther: answers.professionOther }
      : {}),
    referralSource: answers.referralSource,
    [SIGNUP_QUESTIONNAIRE_COMPLETED_KEY]: true
  }
});
