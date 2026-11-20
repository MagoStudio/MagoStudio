import type { LocalSheetRenderModel } from "@domains/scriptProject/constants";

import type { OptionalLocalInstallRequirement } from "../optionalLocalInstallRequirement";

const INSTALL_REQUIREMENT_BY_LOCAL_SHEET_RENDER_MODEL: Record<
  LocalSheetRenderModel,
  OptionalLocalInstallRequirement
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
): OptionalLocalInstallRequirement =>
  INSTALL_REQUIREMENT_BY_LOCAL_SHEET_RENDER_MODEL[localSheetRenderModel];
