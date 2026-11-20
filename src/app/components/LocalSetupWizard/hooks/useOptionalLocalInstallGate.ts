import { useQuery } from "@tanstack/react-query";

import type { OptionalLocalInstallRequirement } from "../optionalLocalInstallRequirement";
import type { RequiredLocalInstall } from "../requiredLocalInstall";

import { useIsModelGroupInstalled } from "./useIsModelGroupInstalled";

const SCRIPT_SETUP_REFETCH_MS = 5000;

export const useOptionalLocalInstallGate = (
  installRequirement: OptionalLocalInstallRequirement | null
): {
  isOptionalLocalInstallComplete: boolean;
  requiredLocalInstall: RequiredLocalInstall;
} => {
  const isModelGroupInstalled = useIsModelGroupInstalled({
    modelGroupId: installRequirement?.modelGroupId ?? null,
    isModelGroupCheckNeeded: installRequirement !== null
  });
  const scriptSetup = useQuery({
    queryKey: ["local-script-setup"],
    queryFn: () => window.mago.comfy.scriptSetupStatus(),
    enabled: installRequirement !== null,
    retry: false,
    refetchInterval: SCRIPT_SETUP_REFETCH_MS
  });
  const perFileSetup = scriptSetup.data?.optional.find(
    (group) => group.id === installRequirement?.optionalScriptSetupId
  );
  const isPerFileSetupMissing =
    perFileSetup?.requirements.some((item) => item.status === "missing") ??
    false;
  const requiredLocalInstall: RequiredLocalInstall =
    installRequirement?.modelGroupId
      ? { kind: "model-group", modelGroupId: installRequirement.modelGroupId }
      : { kind: "manual-download" };
  return {
    isOptionalLocalInstallComplete:
      installRequirement === null ||
      (isModelGroupInstalled && !isPerFileSetupMissing),
    requiredLocalInstall
  };
};
