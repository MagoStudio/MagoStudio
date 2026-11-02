import type { LocalSheetRenderModel } from "@domains/scriptProject/constants";

import type { OptionalScriptSetupId } from "../../../../../desktop/shared/contracts";
import type { LocalModelGroupId } from "../../../../../desktop/shared/localModelGroups";

type LocalSheetModelInstallRequirement = {
  modelGroupId: LocalModelGroupId | null;
  optionalScriptSetupId: OptionalScriptSetupId;
};

const INSTALL_REQUIREMENT_BY_LOCAL_SHEET_RENDER_MODEL: Record<
  LocalSheetRenderModel,
  LocalSheetModelInstallRequirement
> = {
  qwen_image_2512_local: {
    modelGroupId: "qwen-image",
    optionalScriptSetupId: "qwen-image-sheet"
  },
  flux2_klein_4b_q8_local: {
    modelGroupId: "flux-image",
    optionalScriptSetupId: "flux-klein-4b-sheet"
  },
  flux2_klein_9b_q8_local: {
    modelGroupId: null,
    optionalScriptSetupId: "flux-klein-9b-sheet"
  }
};

export const localSheetModelInstallRequirement = (
  localSheetRenderModel: LocalSheetRenderModel
): LocalSheetModelInstallRequirement =>
  INSTALL_REQUIREMENT_BY_LOCAL_SHEET_RENDER_MODEL[localSheetRenderModel];
