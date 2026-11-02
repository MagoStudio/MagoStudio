import { Accordion } from "@components/Accordion";
import { Text } from "@components/Text";
import { MaskTabInfoHint } from "@home/components/MaskTabInfoHint/MaskTabInfoHint";
import { useTool } from "@hooks/tool/useTool";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { SettingsLevel } from "@models/shared/types";
import { RenderSettingsVideoGroups } from "@models/video/RenderSettingsVideoGroups";
import { VideoSettings } from "@models/video/types";
import { settingsGroupsByLevel } from "@models/video/utils/settingsGroupsByLevel";
import { openSettingsLevelsByModelAtom } from "@store/atoms";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useSelectedTracks } from "@/domains/track/useSelectedTracks";
import { isCloudAccountActive } from "@/platform/cloudAccount";
import { isComfyLocalVideoModel } from "@/platform/localVideoModels";

import { CropKeyFrameWarning } from "./CropKeyFrameWarning";
import { InputTrackSelector } from "./InputTrackSelector";
import { ModelSelector } from "./ModelSelector";
import { PresetSelector } from "./PresetSelector";
import { RenderBottom } from "./RenderBottom";
import { SettingsPastedInfoBlock } from "./SettingsPastedInfoBlock";

const NO_OPEN_LEVELS: ReadonlySet<SettingsLevel> = new Set<SettingsLevel>();

export const SettingsEditor: React.FC = () => {
  const { t } = useTranslation();
  const { data: selectedLayers } = useSelectedTracks();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedTrack = selectedLayers?.[0];

  const isTeamMember = useIsTeamMember();
  const { tool: projectMode } = useTool();

  const { renderSettingsValuesAtom, selectedModelAtom, updateValueAtom } =
    useRenderSettingsAtoms();
  const [values] = useAtom(renderSettingsValuesAtom);
  const [selectedModel] = useAtom(selectedModelAtom);
  const updateValue = useSetAtom(updateValueAtom);
  const [openLevelsByModel, setOpenLevelsByModel] = useAtom(
    openSettingsLevelsByModelAtom
  );
  const openLevels = openLevelsByModel[selectedModel.name] ?? NO_OPEN_LEVELS;

  const groupsByLevel = settingsGroupsByLevel(
    selectedModel,
    values,
    isTeamMember
  );

  const setLevelExpanded = (
    level: "quality" | "advanced",
    isExpanded: boolean
  ) => {
    setOpenLevelsByModel((prev) => {
      const next = new Set(prev[selectedModel.name]);
      if (isExpanded) {
        next.add(level);
      } else {
        next.delete(level);
      }
      return { ...prev, [selectedModel.name]: next };
    });
  };

  const handleValueChange = useCallback(
    (key: string, value: unknown) => {
      const updates = selectedModel.onValueChange?.(key, value, values);
      if (updates) {
        Object.entries(updates).forEach(([updateKey, updateVal]) => {
          updateValue({
            key: updateKey as keyof VideoSettings,
            value: updateVal
          });
        });
      }
    },
    [selectedModel, values, updateValue]
  );

  const isMaskMode = projectMode === "mask";
  const arePresetsAvailableForSelectedModel =
    projectMode !== "upscale" &&
    isCloudAccountActive() &&
    !isComfyLocalVideoModel(selectedModel.name);

  return (
    <div className="relative grid grid-rows-[1fr_auto] h-full w-full">
      <SettingsPastedInfoBlock />
      <div className="flex flex-col min-h-0 min-w-0 w-full">
        <div className="flex flex-col gap-2 w-full p-3 border-b border-glyph-invert-main">
          {isMaskMode && <MaskTabInfoHint />}
          {!isMaskMode && <CropKeyFrameWarning />}
          <InputTrackSelector />
          {!isMaskMode && (
            <div className="flex flex-col gap-2">
              {arePresetsAvailableForSelectedModel && (
                <div className="min-w-0">
                  <PresetSelector />
                </div>
              )}
              <div className="min-w-0">
                <ModelSelector />
              </div>
            </div>
          )}
        </div>
        <div
          ref={scrollContainerRef}
          className="scrollbar-custom mt-0 flex min-h-0 flex-col gap-2 overflow-y-auto pt-2 pr-3 pb-4 pl-3"
        >
          <div className="flex flex-col gap-4">
            <RenderSettingsVideoGroups
              groups={groupsByLevel.main}
              values={values}
              isTeamMember={isTeamMember}
              selectedTrack={selectedTrack}
              usesMainSectionSpacing
              onValueChange={handleValueChange}
              writeVideoSettingValue={updateValue}
            />
          </div>
          {(groupsByLevel.technical.length > 0 ||
            groupsByLevel.quality.length > 0 ||
            groupsByLevel.advanced.length > 0) && (
            <>
              <div className="mt-2 flex h-6 shrink-0 items-center justify-between">
                <Text
                  component="h4"
                  variant="sm"
                  color="glyph-secondary"
                  select="none"
                >
                  {t("titles.technical_settings.label")}
                </Text>
              </div>
              {groupsByLevel.technical.length > 0 && (
                <RenderSettingsVideoGroups
                  groups={groupsByLevel.technical}
                  values={values}
                  isTeamMember={isTeamMember}
                  selectedTrack={selectedTrack}
                  onValueChange={handleValueChange}
                  writeVideoSettingValue={updateValue}
                />
              )}
              {groupsByLevel.quality.length > 0 && (
                <Accordion
                  key={`quality-${selectedModel.name}`}
                  label={t("titles.quality_settings.label")}
                  isExpanded={openLevels.has("quality")}
                  onExpandedChange={(isExpanded) =>
                    setLevelExpanded("quality", isExpanded)
                  }
                >
                  <RenderSettingsVideoGroups
                    groups={groupsByLevel.quality}
                    values={values}
                    isTeamMember={isTeamMember}
                    selectedTrack={selectedTrack}
                    onValueChange={handleValueChange}
                    writeVideoSettingValue={updateValue}
                  />
                </Accordion>
              )}
              {groupsByLevel.advanced.length > 0 && (
                <Accordion
                  key={`advanced-${selectedModel.name}`}
                  label={t("titles.advanced_settings.label")}
                  isExpanded={openLevels.has("advanced")}
                  onExpandedChange={(isExpanded) =>
                    setLevelExpanded("advanced", isExpanded)
                  }
                >
                  <RenderSettingsVideoGroups
                    groups={groupsByLevel.advanced}
                    values={values}
                    isTeamMember={isTeamMember}
                    selectedTrack={selectedTrack}
                    onValueChange={handleValueChange}
                    writeVideoSettingValue={updateValue}
                  />
                </Accordion>
              )}
            </>
          )}
        </div>
      </div>
      <RenderBottom />
    </div>
  );
};
