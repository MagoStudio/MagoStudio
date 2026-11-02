import { UseFormSetValue } from "react-hook-form";

import { Img2ImgType } from "../../schemas";

export const SET_VALUE_OPTIONS = {
  shouldValidate: true,
  shouldDirty: true,
  shouldTouch: true
} as const;

export const clearIteratedFormValues = (
  setValue: UseFormSetValue<Img2ImgType>
) => {
  setValue("iteratedAssetId", undefined, SET_VALUE_OPTIONS);
  setValue("iteratedSourceFrame", undefined, SET_VALUE_OPTIONS);
};
