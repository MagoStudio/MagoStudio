"use client";

import { ControlLabel } from "@components/ControlLabel";
import { Dropdown } from "@components/Dropdown";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import {
  TwoLevelsDropdown,
  TwoLevelsDropdownCategory
} from "@components/TwoLevelsDropdown";
import { useRelaxedBadgeLabel } from "@domains/payment/useRelaxedBadgeLabel";
import { isVideoModelAvailableForMode } from "@domains/renders/utils/isVideoModelAvailableForMode";
import { resolveVideoPromptOnModelSwitch } from "@domains/renders/utils/resolveVideoPromptOnModelSwitch";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { useTool } from "@hooks/tool/useTool";
import { useIsTeamMember } from "@hooks/userLocalStorage";
import { RENDER_MODELS } from "@models/video/constants";
import {
  MODEL_CATEGORY_ORDER,
  ModelCategory,
  VideoEngine,
  VideoModelDefinition
} from "@models/video/types";
import { getMinFramesForModel } from "@models/video/utils/getMinFramesForModel";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useToast } from "@store/useToast";
import { useAtom, useSetAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CategoryGroup {
  key: ModelCategory;
  models: VideoModelDefinition[];
}

const groupModelsByCategory = (
  models: VideoModelDefinition[]
): CategoryGroup[] => {
  const grouped = new Map<ModelCategory, VideoModelDefinition[]>();

  for (const model of models) {
    if (!model.category) continue;
    const existing = grouped.get(model.category) ?? [];
    existing.push(model);
    grouped.set(model.category, existing);
  }

  return MODEL_CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => ({
    key: cat,
    models: grouped.get(cat)!
  }));
};

export const ModelSelector: React.FC = () => {
  const { t } = useTranslation();
  const [promptMemory, setPromptMemory] = useState<Record<string, string>>({});
  const isTeamMember = useIsTeamMember();
  const { tool: projectMode } = useTool();
  const { showToast } = useToast();
  const shotMaxFrames = useShotMaxFrames();
  const { fps } = useFpsForShot();
  const relaxedBadgeLabel = useRelaxedBadgeLabel();

  const { renderSettingsValuesAtom, selectedModelAtom, updateValueAtom } =
    useRenderSettingsAtoms();
  const [values] = useAtom(renderSettingsValuesAtom);
  const updateValue = useSetAtom(updateValueAtom);
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);

  const selectedModelName = selectedModel.name;

  const isUpscaleMode = projectMode === "upscale";
  const isMaskMode = projectMode === "mask";
  const modelSelectionMode = isMaskMode
    ? "mask"
    : isUpscaleMode
      ? "upscale"
      : "normal";
  const selectableModelDefinitions = RENDER_MODELS.filter((model) =>
    isVideoModelAvailableForMode(model, modelSelectionMode, {
      isTeamMember
    })
  );

  const categoryGroups = groupModelsByCategory(selectableModelDefinitions);

  const handlePromptOnModelSwitch = (
    newModelName: VideoEngine,
    defaultPrompt: string | undefined
  ) => {
    const { shouldUpdatePrompt, nextPrompt, nextPromptMemory } =
      resolveVideoPromptOnModelSwitch({
        previousModel: selectedModelName,
        nextModel: newModelName,
        currentPrompt: values.prompt as string,
        nextModelDefaultPrompt: defaultPrompt,
        promptMemory
      });

    if (nextPromptMemory !== promptMemory) {
      setPromptMemory(nextPromptMemory);
    }
    if (shouldUpdatePrompt) {
      updateValue({ key: "prompt", value: nextPrompt });
    }
  };

  const updateEngine = (engine: VideoEngine) => {
    const newModel = RENDER_MODELS.find((model) => model.name === engine);
    if (!newModel) return;

    const defaultPrompt = newModel.settingsGroups[0].sections[0].settings.find(
      (setting) => setting.key === "prompt"
    )?.defaultValue;

    handlePromptOnModelSwitch(newModel.name, defaultPrompt);
    setSelectedModel(newModel);

    if (shotMaxFrames <= 0) return;
    const minFrames = getMinFramesForModel(newModel, fps);
    if (shotMaxFrames < minFrames) {
      showToast({
        message: t("notifications.video_too_short_for_model.description", {
          minFrames
        }),
        duration: 5
      });
    }
  };

  if (isUpscaleMode) {
    const selectableModels = selectableModelDefinitions.map((model) => ({
      key: model.name,
      label: model.displayName,
      description: model.description,
      status: model.status
    }));

    return (
      <div className="flex flex-row items-center gap-2">
        <div className="shrink-0 whitespace-nowrap flex items-center gap-1.5">
          <ControlLabel
            labelColor="glyph-tertiary"
            label={t("renderSettings.mago_engine.label")}
          />
          <InfoTooltipIcon
            tooltip={t("renderSettings.upscale_engine.description")}
            labelColor="glyph-tertiary"
          />
        </div>
        <Dropdown
          className="flex-1"
          onChange={(item) => {
            item && updateEngine(item as VideoEngine);
          }}
          value={selectedModelName}
          items={selectableModels}
        />
      </div>
    );
  }

  const dropdownCategories: TwoLevelsDropdownCategory[] = categoryGroups.map(
    (category) => ({
      key: category.key,
      label: t(`renderSettings.model_categories.${category.key}.label`),
      items: category.models.map((model) => {
        const isRelaxedEligible =
          model.modeAvailability?.isRelaxedModeAvailable !== false;
        return {
          key: model.name,
          label: model.displayName,
          description: model.description,
          badge: isRelaxedEligible ? relaxedBadgeLabel : undefined
        };
      })
    })
  );

  return (
    <TwoLevelsDropdown
      className="w-full min-w-0"
      label={t("renderSettings.mago_engine.label")}
      selectedKey={selectedModelName}
      selectedLabel={selectedModel.displayName}
      categories={dropdownCategories}
      onSelectionChange={(key) => updateEngine(key as VideoEngine)}
      ariaLabel={t("renderSettings.mago_engine.label")}
      testId="model-selector-trigger"
    />
  );
};
