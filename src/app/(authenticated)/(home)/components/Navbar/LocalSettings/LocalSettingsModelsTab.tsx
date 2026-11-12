import { LaunchComfyOrSetupMagoStudioButton } from "@app/components/ComfyLaunchDialog/LaunchComfyOrSetupMagoStudioButton";
import { Input } from "@components/Input";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type { LocalTextModelProvider } from "../../../../../../../desktop/shared/contracts";

import { ComfyVersionStatus } from "./ComfyVersionStatus";
import { LocalModelSettingsPanel } from "./LocalModelSettingsPanel";
import { LocalTextProviderRadios } from "./LocalTextProviderRadios";
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
  textModelProvider: LocalTextModelProvider;
  isCloudTextModelDisabled: boolean;
  onTextModelChange: (provider: LocalTextModelProvider) => void;
  onModelSettingsSaved?: () => Promise<void>;
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
  textModelProvider,
  isCloudTextModelDisabled,
  onTextModelChange,
  textModelReady,
  textModelHint,
  onModelSettingsSaved
}: Props) => {
  const { t } = useTranslation();
  const isComfyConnected = comfyConnectionReady === true;

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
      <ComfyVersionStatus endpoint={comfyEndpoint} />
      {isSavedComfyEndpointUnavailable && (
        <LaunchComfyOrSetupMagoStudioButton
          onSetup={onSetupMagoStudio}
          onBeforeOpenComfyLaunch={onBeforeOpenComfyLaunch}
        />
      )}
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-2">
          <SettingsStatusMark
            ready={textModelReady}
            label={t("localSettings.models.textModelLabel")}
          />
          <Text component="span" variant="xs" color="glyph-secondary">
            {t("localSettings.models.textModelLabel")}
          </Text>
        </span>
        <LocalTextProviderRadios
          value={textModelProvider}
          onChange={onTextModelChange}
          cloudDisabled={isCloudTextModelDisabled}
        />
        {textModelReady === false && (
          <Text variant="xs" color="glyph-error">
            {textModelHint}
          </Text>
        )}
      </div>
      {isComfyConnected && (
        <LocalModelSettingsPanel
          key={comfyEndpoint}
          endpoint={comfyEndpoint}
          onSaved={onModelSettingsSaved}
          onSetup={onSetupMagoStudio}
        />
      )}
    </div>
  );
};
