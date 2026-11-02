/* oxlint-disable custom-react/no-use-effect -- legitimate sync of internal state to parent prop */
import { ControlLabel } from "@components/ControlLabel";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { TabMenuRegular } from "@components/TabMenuRegular";
import { Text } from "@components/Text";
import {
  TwoLevelsDropdown,
  TwoLevelsDropdownCategory
} from "@components/TwoLevelsDropdown";
import {
  getSelectablePlanVideoModels,
  groupPlanVideoModelsByCategory
} from "@domains/plan/utils/getSelectablePlanVideoModels";
import { useMountEffect } from "@hooks/useMountEffect";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { RENDER_MODELS } from "@models/video/constants";
import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import {
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { deriveImageSequenceExport } from "@models/video/utils/deriveImageSequenceExport";
import { useToast } from "@store/useToast";
import { cn } from "@utils";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Tabs, TabPanel } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { PlanVideoSettingsRenderer } from "./PlanVideoSettingsRenderer";

export interface PlanVideoSectionHandle {
  getValues: () => { values: VideoSettings; modelName: VideoEngine };
}

interface PlanVideoSectionProps {
  onValuesChange?: (values: VideoSettings, model: VideoModelDefinition) => void;
  initialValues?: VideoSettings;
  initialModelEngine?: VideoEngine;
}

export const PlanVideoSection = forwardRef<
  PlanVideoSectionHandle,
  PlanVideoSectionProps
>(function PlanVideoSection(
  { onValuesChange, initialValues, initialModelEngine },
  ref
) {
  const { t } = useTranslation();
  const { showHintToast } = useToast();
  const isTeamMember = useIsTeamMember();

  const selectableModels = getSelectablePlanVideoModels(isTeamMember);

  const isEngineExcluded =
    !!initialModelEngine &&
    !selectableModels.find((m) => m.name === initialModelEngine);

  const initialModel = initialModelEngine
    ? (selectableModels.find((m) => m.name === initialModelEngine) ??
      selectableModels[0])
    : selectableModels[0];

  const [selectedModel, setSelectedModel] =
    useState<VideoModelDefinition>(initialModel);

  const [values, setValues] = useState<VideoSettings>(() => {
    if (!initialValues || isEngineExcluded)
      return extractDefaultVideoSettings(initialModel, isTeamMember);
    const frontend = initialModel.formatValuesForFrontend
      ? initialModel.formatValuesForFrontend(initialValues)
      : initialValues;
    return deriveImageSequenceExport(frontend);
  });

  useMountEffect(() => {
    if (isEngineExcluded) {
      showHintToast(t("plan.reuse_video_engine_excluded.label"));
    }
  });

  useImperativeHandle(ref, () => ({
    getValues: () => ({ values, modelName: selectedModel.name })
  }));

  useEffect(() => {
    onValuesChange?.(values, selectedModel);
  }, [values, selectedModel, onValuesChange]);

  const handleModelChange = (engineKey: string) => {
    const newModel = RENDER_MODELS.find((m) => m.name === engineKey);
    if (!newModel) return;
    setSelectedModel(newModel);
    setValues(extractDefaultVideoSettings(newModel, isTeamMember));
  };

  const handleSettingChange = (key: string, value: unknown) => {
    setValues((prev) => {
      const sideEffects = selectedModel.onValueChange?.(key, value, prev) ?? {};
      return { ...prev, [key]: value, ...sideEffects } as VideoSettings;
    });
  };

  const filteredTabs = selectedModel.settingsGroups.filter(
    (group) => !group.hidingCondition?.(values, isTeamMember)
  );

  const tabsList = filteredTabs.map((tab, index) => ({
    name: tab.name,
    id: `plan-video-tab-${index}`
  }));

  const categoryGroups = groupPlanVideoModelsByCategory(selectableModels);

  const dropdownCategories: TwoLevelsDropdownCategory[] = categoryGroups.map(
    (category) => ({
      key: category.key,
      label: t(`renderSettings.model_categories.${category.key}.label`),
      items: category.models.map((model) => ({
        key: model.name,
        label: model.displayName,
        description: model.description
      }))
    })
  );

  return (
    <div className="flex flex-col gap-4">
      <Text variant="md" weight="semibold" color="glyph-primary">
        {t("plan.video_settings.label")}
      </Text>
      <div className="flex flex-row items-center gap-2">
        <div className="shrink-0 whitespace-nowrap flex items-center gap-1.5">
          <ControlLabel
            labelColor="glyph-tertiary"
            label={t("renderSettings.mago_engine.label")}
          />
          <InfoTooltipIcon
            tooltip={t("renderSettings.engine.description")}
            labelColor="glyph-tertiary"
          />
        </div>
        <TwoLevelsDropdown
          selectedKey={selectedModel.name}
          selectedLabel={selectedModel.displayName}
          categories={dropdownCategories}
          onSelectionChange={(key) => handleModelChange(key as string)}
          ariaLabel={t("renderSettings.mago_engine.label")}
        />
      </div>
      <Tabs className="flex flex-col min-h-0">
        {tabsList.length > 0 && (
          <div
            className={cn(
              "flex items-center justify-between mb-4",
              tabsList.length === 1 && "hidden"
            )}
          >
            <TabMenuRegular tabs={tabsList} />
          </div>
        )}
        {filteredTabs.map((tab, tabIndex) => (
          <TabPanel key={tab.name} id={`plan-video-tab-${tabIndex}`}>
            <div className="flex flex-col">
              {tab.sections
                .filter((section) => {
                  if (!section.hidingCondition) return true;
                  return !section.hidingCondition(values, isTeamMember);
                })
                .map((section, sectionIndex) => (
                  <PlanVideoSettingsRenderer
                    key={section.name || `section-${sectionIndex}`}
                    section={section}
                    values={values}
                    isTeamMember={isTeamMember}
                    onSettingChange={handleSettingChange}
                    withDivider={sectionIndex !== tab.sections.length - 1}
                  />
                ))}
            </div>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
});
