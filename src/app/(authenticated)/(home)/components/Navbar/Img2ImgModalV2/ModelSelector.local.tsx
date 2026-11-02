import { FieldSelect } from "@components/Form/Fields/FieldSelect";
import { Text } from "@components/Text";
import { useRelaxedBadgeLabel } from "@domains/payment/useRelaxedBadgeLabel";
import React, { useCallback, useEffect, useState } from "react";
import { Key } from "react-aria-components/Breadcrumbs";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { isComfyLocalImageModel } from "@/platform/localImageModels";
import { pickModelFallback } from "@/platform/modelFallback";
import {
  PROVIDER_LABEL,
  providersForImageModel
} from "@/platform/modelProviders";
import {
  isImageModelAvailable,
  resolveImageRenderProvider
} from "@/platform/renderTarget";
import { useProviderPreferences } from "@/platform/useProviderPreferences";

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
  const providerPreferences = useProviderPreferences();
  const [modelWarning, setModelWarning] = useState<{
    model: string;
    message: string;
  } | null>(null);
  const selectedModel = useWatch<Img2ImgType>({ name: "model" });

  useEffect(() => {
    if (
      typeof selectedModel !== "string" ||
      !isComfyLocalImageModel(selectedModel) ||
      !window.mago?.comfy
    ) {
      return;
    }

    let active = true;
    void window.mago.comfy
      .modelStatus({ model: selectedModel })
      .then((status) => {
        if (!active) return;
        setModelWarning(
          status.ready
            ? null
            : {
                model: selectedModel,
                message: status.message ?? `${selectedModel} is not ready`
              }
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        setModelWarning({
          model: selectedModel,
          message:
            error instanceof Error
              ? error.message
              : `Unable to validate ${selectedModel}`
        });
      });

    return () => {
      active = false;
    };
  }, [selectedModel]);

  const visibleModelWarning =
    typeof selectedModel === "string" && modelWarning?.model === selectedModel
      ? modelWarning.message
      : null;

  // Cloud image models stay listed when signed in, and are filtered out only
  // when they genuinely cannot run — this dropdown has no disabled state.
  const visibleOptions = ALL_MODEL_OPTIONS
    // Switched off in settings: hidden, same as the video selector. A model
    // that can still reach some other provider stays listed.
    .filter((option) =>
      providersForImageModel(option.key).some(
        (provider) => providerPreferences[provider]
      )
    )
    .filter((option) =>
      isImageModelAvailable(option.key, undefined, providerPreferences)
    );
  const modelOptions = visibleOptions.map((option) => {
    // Where it will actually run, not just the first provider it could use --
    // which changes with the switches and with being signed in.
    const provider = resolveImageRenderProvider(
      option.key,
      undefined,
      providerPreferences
    );
    return {
      ...option,
      providerBadge: provider ? PROVIDER_LABEL[provider] : undefined,
      badge: modelAdapters[option.key as Img2ImgType["model"]]
        ?.availableInRelaxedMode
        ? relaxedBadgeLabel
        : undefined
    };
  });
  const fallbackModel =
    typeof selectedModel === "string"
      ? pickModelFallback(visibleOptions, selectedModel, (option) => option.key)
      : null;

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

  // Keep the form valid when a provider switch removes its active model.
  useEffect(() => {
    if (fallbackModel) handleModelChange(fallbackModel.key);
  }, [fallbackModel, handleModelChange]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <FieldSelect
        name="model"
        items={modelOptions}
        label={t("titles.model.label")}
        tooltip={t("titles.model.description")}
        onChange={handleModelChange}
      />
      {visibleModelWarning && (
        <Text variant="2xs" color="glyph-warning">
          {visibleModelWarning}
        </Text>
      )}
    </div>
  );
};
