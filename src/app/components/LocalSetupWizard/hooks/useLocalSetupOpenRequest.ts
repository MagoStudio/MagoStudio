import { useQueryClient } from "@tanstack/react-query";

import type { LocalSetupOpenRequest } from "../localSetupWizardHandoff";
import type { RequiredLocalInstall } from "../requiredLocalInstall";

import { useHasCompletedLocalSetup } from "./useHasCompletedLocalSetup";
import { LOCAL_MODEL_GROUPS_STATUS_QUERY_KEY } from "./useLocalModelGroupsStatus";

export const useLocalSetupOpenRequest = (
  requiredLocalInstall: RequiredLocalInstall | undefined
): {
  isUpdatingInstallation: boolean;
  resolveOpenRequest: () => Promise<LocalSetupOpenRequest | undefined>;
} => {
  const queryClient = useQueryClient();
  const hasCompletedLocalSetup = useHasCompletedLocalSetup();
  const isUpdatingInstallation =
    hasCompletedLocalSetup && requiredLocalInstall !== undefined;
  const resolveOpenRequest = async (): Promise<
    LocalSetupOpenRequest | undefined
  > => {
    if (!isUpdatingInstallation) return undefined;
    if (requiredLocalInstall.kind === "manual-download")
      return { kind: "manual-download" };
    const modelGroupsStatus = await queryClient
      .fetchQuery({
        queryKey: LOCAL_MODEL_GROUPS_STATUS_QUERY_KEY,
        queryFn: () => window.mago.localSetup.modelGroupsStatus()
      })
      .catch(() => null);
    return modelGroupsStatus?.isGetStartedInstall
      ? {
          kind: "update-installation",
          preselectedModelGroupIds: [requiredLocalInstall.modelGroupId]
        }
      : { kind: "manual-download" };
  };
  return { isUpdatingInstallation, resolveOpenRequest };
};
