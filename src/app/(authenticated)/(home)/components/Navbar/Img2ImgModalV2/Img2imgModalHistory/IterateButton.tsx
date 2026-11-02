import { GhostButton } from "@components/GhostButton";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { SET_VALUE_OPTIONS } from "../hooks/utils/clearIteratedFormValues";
import { Img2ImgType } from "../schemas";

type Props = {
  assetId: string;
  sourceFrame?: number;
  isDisabled?: boolean;
};

export const IterateButton: React.FC<Props> = ({
  assetId,
  sourceFrame,
  isDisabled = false
}) => {
  const { t } = useTranslation();
  const { setValue, trigger } = useFormContext<Img2ImgType>();

  const handleIterate = async () => {
    setValue("frameType", "upload", SET_VALUE_OPTIONS);
    setValue("iteratedAssetId", assetId, SET_VALUE_OPTIONS);
    setValue("iteratedSourceFrame", sourceFrame, SET_VALUE_OPTIONS);
    setValue("uploadedImageId", undefined, SET_VALUE_OPTIONS);
    await trigger();
  };

  return (
    <GhostButton
      aria-label="Iterate"
      onPress={handleIterate}
      isDisabled={isDisabled}
    >
      {t("actions.iterate.label")}
    </GhostButton>
  );
};
