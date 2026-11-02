import { UseFormSetValue } from "react-hook-form";

import { Seedream5ProType } from "../../schemas/seedream5Pro.schema";

export const clearDrawnMask = (setValue: UseFormSetValue<Seedream5ProType>) => {
  setValue("maskLayerDataUrl", undefined);
  setValue("maskedFrameSrc", undefined);
  setValue("maskFrameIdx", undefined);
};
