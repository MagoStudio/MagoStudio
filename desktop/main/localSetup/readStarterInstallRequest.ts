import type { StarterInstallRequest } from "../../shared/contracts";
import { isLocalModelGroupId } from "../../shared/localModelGroups";

export const readStarterInstallRequest = (
  request: unknown
): StarterInstallRequest | undefined => {
  if (request === undefined || request === null) return undefined;
  const modelGroupIds =
    typeof request === "object" && "modelGroupIds" in request
      ? request.modelGroupIds
      : undefined;
  if (
    !Array.isArray(modelGroupIds) ||
    !modelGroupIds.every(isLocalModelGroupId)
  )
    throw new Error("Choose model groups by their known ids.");
  return { modelGroupIds };
};
