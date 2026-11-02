import { enrichUnsafeMetadata } from "@config/utils/enrichUnsafeMetadata";
import { useUser } from "@platform/identity";

import { QuestionnaireAnswers } from "./questionnaire";
import { useOnboardingProgress } from "./useOnboardingProgress";
import { buildQuestionnaireMetadataUpdate } from "./utils/buildQuestionnaireMetadataUpdate";

export const useSubmitOnboardingQuestionnaire = () => {
  const { user } = useUser();
  const [, setProgress] = useOnboardingProgress();

  const submitQuestionnaire = async (answers: QuestionnaireAnswers) => {
    if (!user)
      throw new Error("Cannot submit questionnaire: no signed-in user");

    const { firstName, lastName, unsafeMetadata } =
      buildQuestionnaireMetadataUpdate(answers);

    await enrichUnsafeMetadata(user, unsafeMetadata, { firstName, lastName });

    setProgress((prev) => ({ ...prev, step: "upload" }));
  };

  return { submitQuestionnaire };
};
