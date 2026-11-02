import { useUser } from "@platform/identity";

import { isSignupQuestionnaireCompleted } from "./utils/isSignupQuestionnaireCompleted";

export const useIsSignupQuestionnaireCompleted = (): boolean => {
  const { user } = useUser();

  return isSignupQuestionnaireCompleted(user?.unsafeMetadata);
};
