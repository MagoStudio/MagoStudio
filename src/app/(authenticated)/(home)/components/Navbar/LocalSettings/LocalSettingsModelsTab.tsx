import { LaunchComfyOrSetupMagoStudioButton } from "@app/components/ComfyLaunchDialog/LaunchComfyOrSetupMagoStudioButton";
import { Input } from "@components/Input";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type { LocalScriptTextModel } from "../../../../../../../desktop/shared/contracts";

import { SettingsStatusMark } from "./SettingsStatusMark";

type Props = {
  isOpenedBecauseComfyIsNeeded: boolean;
  comfyEndpoint: string;
  onComfyEndpointChange: (endpoint: string) => void;
  onComfyEndpointBlur: () => void;
  comfyConnectionReady: boolean | null;
  comfyConnectionHint: string;
  isSavedComfyEndpointUnavailable: boolean;
  onSetupMagoStudio: () => void;
  onBeforeOpenComfyLaunch: () => Promise<boolean>;
  selectedTextModel: "cloud" | LocalScriptTextModel;
  isCloudTextModelDisabled: boolean;
  onTextModelChange: (textModel: "cloud" | LocalScriptTextModel) => void;
  textModelReady: boolean | null;
  textModelHint: string;
};

export const LocalSettingsModelsTab = ({
  isOpenedBecauseComfyIsNeeded,
  comfyEndpoint,
  onComfyEndpointChange,
  onComfyEndpointBlur,
  comfyConnectionReady,
  comfyConnectionHint,
  isSavedComfyEndpointUnavailable,
  onSetupMagoStudio,
  onBeforeOpenComfyLaunch,
  selectedTextModel,
  isCloudTextModelDisabled,
  onTextModelChange,
  textModelReady,
  textModelHint
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Text variant="sm" weight="bold">
          {t("localSettings.models.heading")}
        </Text>
        <Text variant="2xs" color="glyph-tertiary">
          {t("localSettings.models.description")}
        </Text>
      </div>
      {isOpenedBecauseComfyIsNeeded && (
        <Text variant="xs" color="glyph-warning">
          {t("localSettings.models.comfyNeeded")}
        </Text>
      )}
      <label className="flex flex-col gap-1">
        <span className="flex items-center gap-2">
          <SettingsStatusMark
            ready={comfyConnectionReady}
            label={t("localSettings.models.endpointLabel")}
          />
          <Text component="span" variant="xs" color="glyph-secondary">
            {t("localSettings.models.endpointLabel")}
          </Text>
        </span>
        <Input
          aria-label={t("localSettings.models.endpointAriaLabel")}
          autoComplete="off"
          value={comfyEndpoint}
          onBlur={onComfyEndpointBlur}
          onChange={(event) => onComfyEndpointChange(event.target.value)}
        />
        {comfyConnectionReady === false && (
          <Text variant="xs" color="glyph-error">
            {comfyConnectionHint}
          </Text>
        )}
      </label>
      {isSavedComfyEndpointUnavailable && (
        <LaunchComfyOrSetupMagoStudioButton
          onSetup={onSetupMagoStudio}
          onBeforeOpenComfyLaunch={onBeforeOpenComfyLaunch}
        />
      )}
      <label className="flex flex-col gap-1">
        <span className="flex items-center gap-2">
          <SettingsStatusMark
            ready={textModelReady}
            label={t("localSettings.models.textModelLabel")}
          />
          <Text component="span" variant="xs" color="glyph-secondary">
            {t("localSettings.models.textModelLabel")}
          </Text>
        </span>
        <select
          aria-label={t("localSettings.models.textModelLabel")}
          className="h-8 rounded border border-element-primary bg-element-primary px-2 text-sm text-glyph-secondary outline-hidden focus-visible:outline-1 focus-visible:outline-glyph-action-main"
          value={selectedTextModel}
          onChange={(event) =>
            onTextModelChange(
              event.target.value as "cloud" | LocalScriptTextModel
            )
          }
        >
          <option value="cloud" disabled={isCloudTextModelDisabled}>
            {t("localSettings.models.textModelCloud")}
          </option>
          <option value="qwen38-27b-q3">
            {t("localSettings.models.textModelQwenQ3")}
          </option>
          <option value="qwen38-27b-q5">
            {t("localSettings.models.textModelQwenQ5")}
          </option>
        </select>
        {textModelReady === false && (
          <Text variant="xs" color="glyph-error">
            {textModelHint}
          </Text>
        )}
      </label>
    </div>
  );
};
