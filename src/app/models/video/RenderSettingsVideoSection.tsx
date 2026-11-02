import { Accordion } from "@components/Accordion";
import { Text } from "@components/Text";
import { doesModelDisableFacemeshBlending } from "@domains/renders/utils/doesModelDisableFacemeshBlending";
import { SettingsSection } from "@models/shared/types";
import { VideoEngine, VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";
import { openNamedSectionsByModelAtom } from "@store/atoms";
import { cn } from "@utils";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { VideoComponentWrapper } from "./renderVideoComponent";

const NO_OPEN_NAMED_SECTIONS: ReadonlySet<string> = new Set<string>();

export type WriteVideoSettingValue = (payload: {
  key: keyof VideoSettings;
  value: any;
  preservePreset?: boolean;
}) => void;

interface Props {
  section: SettingsSection;
  values: any;
  isDisabled?: boolean;
  selectedTrack?: Layer;
  isTeamMember: boolean;
  usesMainSectionSpacing?: boolean;
  onValueChange?: (key: string, value: unknown) => void;
  writeVideoSettingValue: WriteVideoSettingValue;
  errorMessageBySettingKey?: Record<string, string>;
}

export const RenderSettingsVideoSection: React.FC<Props> = ({
  section,
  values,
  isDisabled,
  selectedTrack,
  isTeamMember,
  usesMainSectionSpacing,
  onValueChange,
  writeVideoSettingValue,
  errorMessageBySettingKey
}) => {
  const { t } = useTranslation();
  const [openNamedSectionsByModel, setOpenNamedSectionsByModel] = useAtom(
    openNamedSectionsByModelAtom
  );
  const modelName = values.mago_engine as VideoEngine;
  const openNamedSections =
    openNamedSectionsByModel[modelName] ?? NO_OPEN_NAMED_SECTIONS;
  const sectionName = section.name;
  const isNamedSectionExpanded =
    !!sectionName && openNamedSections.has(sectionName);

  const setIsNamedSectionExpanded = (nextExpanded: boolean) => {
    if (!sectionName) return;
    setOpenNamedSectionsByModel((prev) => {
      const next = new Set(prev[modelName]);
      if (nextExpanded) {
        next.add(sectionName);
      } else {
        next.delete(sectionName);
      }
      return { ...prev, [modelName]: next };
    });
  };

  const visibleSettings = section.settings.filter((setting) => {
    if (
      setting.key === "enable_facemesh_blending" &&
      doesModelDisableFacemeshBlending(values.mago_engine as VideoEngine)
    ) {
      return false;
    }
    if (!setting.hidingCondition) return true;
    return !setting.hidingCondition(values, isTeamMember);
  });

  if (visibleSettings.length === 0) return null;

  const laysSettingsSideBySide = section.settingsPerRow === 2;
  const sideBySideGapClassName = usesMainSectionSpacing
    ? "gap-x-2 gap-y-4"
    : "gap-2";
  const stackedGapClassName = section.isNamedCollapsible
    ? "gap-2"
    : usesMainSectionSpacing
      ? "gap-4"
      : "gap-3";
  const settingsGapClassName = laysSettingsSideBySide
    ? sideBySideGapClassName
    : stackedGapClassName;

  const settingsGrid = (
    <div
      className={cn(
        laysSettingsSideBySide
          ? "grid grid-cols-2 items-start"
          : "flex flex-col",
        settingsGapClassName,
        section.isControlNetDetailSetting && "pl-8"
      )}
    >
      {visibleSettings.map((setting) => {
        let value = values[setting.key];
        let secondValue = setting.secondKey
          ? values[setting.secondKey]
          : undefined;

        if (setting.formatValueForFrontend) {
          const backendValue = values[setting.key];
          const backendSecondValue = setting.secondKey
            ? values[setting.secondKey]
            : undefined;

          if (setting.secondKey) {
            const combinedBackendValue = {
              [setting.key]: backendValue,
              [setting.secondKey]: backendSecondValue
            };
            const formatted =
              setting.formatValueForFrontend(combinedBackendValue);
            if (formatted && typeof formatted === "object") {
              value = formatted[setting.key];
              secondValue = formatted[setting.secondKey];
            } else {
              value = formatted;
            }
          } else {
            value = setting.formatValueForFrontend(value);
          }
        }

        const setValue = (newValue: any) => {
          if (setting.formatValueForBackend && setting.secondKey) {
            const currentSecondValue = values[setting.secondKey];
            const formatted = setting.formatValueForBackend(
              newValue,
              currentSecondValue
            );
            if (formatted && typeof formatted === "object") {
              if (setting.key in formatted) {
                writeVideoSettingValue({
                  key: setting.key as keyof VideoSettings,
                  value: formatted[setting.key]
                });
              }
              if (setting.secondKey in formatted) {
                writeVideoSettingValue({
                  key: setting.secondKey as keyof VideoSettings,
                  value: formatted[setting.secondKey]
                });
              }
            }
          } else if (setting.formatValueForBackend) {
            writeVideoSettingValue({
              key: setting.key as keyof VideoSettings,
              value: setting.formatValueForBackend(newValue)
            });
          } else {
            writeVideoSettingValue({
              key: setting.key as keyof VideoSettings,
              value: newValue
            });
          }
        };

        const setSecondValue = setting.secondKey
          ? (newSecondValue: any) => {
              if (setting.formatValueForBackend) {
                const currentValue = values[setting.key];
                const formatted = setting.formatValueForBackend(
                  currentValue,
                  newSecondValue
                );
                if (
                  formatted &&
                  typeof formatted === "object" &&
                  setting.secondKey
                ) {
                  if (setting.key in formatted) {
                    writeVideoSettingValue({
                      key: setting.key as keyof VideoSettings,
                      value: formatted[setting.key]
                    });
                  }
                  if (setting.secondKey in formatted) {
                    writeVideoSettingValue({
                      key: setting.secondKey as keyof VideoSettings,
                      value: formatted[setting.secondKey]
                    });
                  }
                }
              } else {
                writeVideoSettingValue({
                  key: setting.secondKey! as keyof VideoSettings,
                  value: newSecondValue
                });
              }
            }
          : undefined;

        const settingErrorMessage = errorMessageBySettingKey?.[setting.key];

        return (
          <div key={setting.key} className="flex flex-col gap-1">
            <VideoComponentWrapper
              setting={setting}
              value={value}
              setValue={setValue}
              secondValue={secondValue}
              setSecondValue={setSecondValue}
              isDisabled={isDisabled}
              selectedTrack={selectedTrack}
              options={setting.type === "enum" ? setting.options : undefined}
              allValues={values}
              isTeamMember={isTeamMember}
              onValueChange={onValueChange}
            />
            {settingErrorMessage && (
              <Text component="span" variant="xs" color="glyph-error">
                {settingErrorMessage}
              </Text>
            )}
          </div>
        );
      })}
    </div>
  );

  if (section.isNamedCollapsible && section.name) {
    return (
      <div className="-mt-2">
        <Accordion
          label={t(section.name)}
          isExpanded={isNamedSectionExpanded}
          onExpandedChange={setIsNamedSectionExpanded}
        >
          {settingsGrid}
        </Accordion>
      </div>
    );
  }

  return settingsGrid;
};
