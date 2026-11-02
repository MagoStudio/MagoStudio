import { ControlLabel } from "@components/ControlLabel";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { Text } from "@components/Text";
import { Setting } from "@models/shared/types";
import { VideoComponentWrapper } from "@models/video/renderVideoComponent";
import { VideoSettings } from "@models/video/types";

interface PlanVideoSettingsRendererProps {
  section: {
    name: string | undefined;
    tooltip?: string;
    settings: Setting[];
  };
  values: VideoSettings;
  isTeamMember: boolean;
  onSettingChange: (key: string, value: unknown) => void;
  withDivider?: boolean;
}

export const PlanVideoSettingsRenderer: React.FC<
  PlanVideoSettingsRendererProps
> = ({
  section,
  values,
  isTeamMember,
  onSettingChange,
  withDivider = true
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        {section.tooltip && section.name ? (
          <div className="flex items-center gap-1.5">
            <ControlLabel label={section.name} />
            <InfoTooltipIcon tooltip={section.tooltip} />
          </div>
        ) : section.name ? (
          <div className="flex items-center pb-1.5 h-12">
            <Text
              className="min-w-0 max-w-full"
              color="glyph-secondary"
              component="h4"
              select="none"
              variant="md"
            >
              {section.name}
            </Text>
          </div>
        ) : undefined}
        <div className="flex flex-col gap-4">
          {section.settings
            .filter((setting) => {
              if (!setting.hidingCondition) return true;
              return !setting.hidingCondition(values, isTeamMember);
            })
            .map((setting) => {
              let value = values[setting.key];
              let secondValue = setting.secondKey
                ? values[setting.secondKey]
                : undefined;

              if (setting.formatValueForFrontend) {
                if (setting.secondKey) {
                  const combinedBackendValue = {
                    [setting.key]: value,
                    [setting.secondKey]: secondValue
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

              const setValue = (newValue: unknown) => {
                if (setting.formatValueForBackend && setting.secondKey) {
                  const currentSecondValue = values[setting.secondKey];
                  const formatted = setting.formatValueForBackend(
                    newValue,
                    currentSecondValue
                  );
                  if (formatted && typeof formatted === "object") {
                    if (setting.key in formatted) {
                      onSettingChange(setting.key, formatted[setting.key]);
                    }
                    if (setting.secondKey in formatted) {
                      onSettingChange(
                        setting.secondKey,
                        formatted[setting.secondKey]
                      );
                    }
                  }
                } else if (setting.formatValueForBackend) {
                  onSettingChange(
                    setting.key,
                    setting.formatValueForBackend(newValue)
                  );
                } else {
                  onSettingChange(setting.key, newValue);
                }
              };

              const setSecondValue = setting.secondKey
                ? (newSecondValue: unknown) => {
                    if (setting.formatValueForBackend && setting.secondKey) {
                      const currentValue = values[setting.key];
                      const formatted = setting.formatValueForBackend(
                        currentValue,
                        newSecondValue
                      );
                      if (formatted && typeof formatted === "object") {
                        if (setting.key in formatted) {
                          onSettingChange(setting.key, formatted[setting.key]);
                        }
                        if (setting.secondKey in formatted) {
                          onSettingChange(
                            setting.secondKey,
                            formatted[setting.secondKey]
                          );
                        }
                      }
                    } else if (setting.secondKey) {
                      onSettingChange(setting.secondKey, newSecondValue);
                    }
                  }
                : undefined;

              return (
                <VideoComponentWrapper
                  key={setting.key}
                  setting={setting}
                  value={value}
                  setValue={setValue}
                  secondValue={secondValue}
                  setSecondValue={setSecondValue}
                  options={
                    setting.type === "enum" ? setting.options : undefined
                  }
                  allValues={values}
                  isTeamMember={isTeamMember}
                />
              );
            })}
        </div>
      </div>
      {withDivider && <div className="h-px bg-glyph-stroke my-2" />}
    </div>
  );
};
