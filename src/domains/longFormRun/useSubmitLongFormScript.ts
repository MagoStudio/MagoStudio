import { useCreateScenarioPlan } from "./data/useCreateScenarioPlan";
import { useSetLongFormRunIdInUrl } from "./data/useSetLongFormRunIdInUrl";
import { buildScenarioRunRequest } from "./utils/buildScenarioRunRequest";

export const useSubmitLongFormScript = () => {
  const { mutate, isPending, isError } = useCreateScenarioPlan();
  const setLongFormRunIdInUrl = useSetLongFormRunIdInUrl();

  const submitScript = (script: string) => {
    const request = buildScenarioRunRequest(script);
    mutate(request, {
      onSuccess: (created) => {
        setLongFormRunIdInUrl(created.plan_id);
      }
    });
  };

  return {
    submitScript,
    isSubmittingLongFormScript: isPending,
    didLongFormScriptSubmissionFail: isError
  };
};
