import { FieldSelect } from "@components/Form/Fields/FieldSelect";
import { useRelaxedBadgeLabel } from "@domains/payment/useRelaxedBadgeLabel";
import React, { useCallback } from "react";
import { Key } from "react-aria-components/Breadcrumbs";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { modelAdapters } from "./adapters";
import { Img2ImgSchema, ModelSchemaMap, Img2ImgType } from "./schemas";

const ALL_MODEL_OPTIONS = Object.values(ModelSchemaMap).map((model) => ({
  label: model.label,
  key: model.value,
  description: model.description
}));

export const ModelSelector: React.FC = () => {
  const { t } = useTranslation();
  const { reset, getValues, trigger } = useFormContext<Img2ImgType>();
  const relaxedBadgeLabel = useRelaxedBadgeLabel();

  const modelOptions = ALL_MODEL_OPTIONS.map((option) => ({
    ...option,
    badge: modelAdapters[option.key as Img2ImgType["model"]]
      ?.availableInRelaxedMode
      ? relaxedBadgeLabel
      : undefined
  }));

  const handleModelChange = useCallback(
    (newModel: Key | Key[] | null) => {
      if (!newModel || Array.isArray(newModel)) return;
      const modelValue = String(newModel);
      const {
        frameType,
        uploadedImageId,
        iteratedAssetId,
        // @ts-ignore
        referenceImages,
        prompt
      } = getValues();
      const newDefaults = Img2ImgSchema.parse({ model: modelValue });

      const preservedFields = {
        frameType,
        uploadedImageId,
        iteratedAssetId,
        referenceImages,
        ...(prompt ? { prompt } : {})
      };

      reset({ ...newDefaults, ...preservedFields });
      void trigger();
    },
    [reset, getValues, trigger]
  );

  return (
    <FieldSelect
      name="model"
      items={modelOptions}
      label={t("titles.model.label")}
      tooltip={t("titles.model.description")}
      onChange={handleModelChange}
    />
  );
};
