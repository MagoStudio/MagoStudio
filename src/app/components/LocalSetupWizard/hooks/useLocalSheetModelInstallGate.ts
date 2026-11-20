import {
  isLocalSheetRenderModel,
  type AnySheetRenderModel
} from "@domains/scriptProject/constants";

import type { RequiredLocalInstall } from "../requiredLocalInstall";
import { localSheetModelInstallRequirement } from "../utils/localSheetModelInstallRequirement";

import { useOptionalLocalInstallGate } from "./useOptionalLocalInstallGate";

export const useLocalSheetModelInstallGate = ({
  sheetRenderModel,
  isLocalProject
}: {
  sheetRenderModel: AnySheetRenderModel;
  isLocalProject: boolean;
}): {
  isLocalSheetModelInstalled: boolean;
  requiredLocalInstall: RequiredLocalInstall;
} => {
  const localSheetRenderModel =
    isLocalProject && isLocalSheetRenderModel(sheetRenderModel)
      ? sheetRenderModel
      : null;
  const { isOptionalLocalInstallComplete, requiredLocalInstall } =
    useOptionalLocalInstallGate(
      localSheetRenderModel
        ? localSheetModelInstallRequirement(localSheetRenderModel)
        : null
    );
  return {
    isLocalSheetModelInstalled: isOptionalLocalInstallComplete,
    requiredLocalInstall
  };
};
