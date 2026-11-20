import type { OptionalScriptSetupId } from "../../../../desktop/shared/contracts";
import type { LocalModelGroupId } from "../../../../desktop/shared/localModelGroups";

export type OptionalLocalInstallRequirement = {
  modelGroupId: LocalModelGroupId | null;
  optionalScriptSetupId: OptionalScriptSetupId;
};
