import { Text } from "@components/Text";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { isComfyVersionAtLeast } from "../../../../../../../desktop/shared/isComfyVersionAtLeast";
import { REQUIRED_COMFYUI_VERSION } from "../../../../../../../desktop/shared/requiredComfyVersion";

import { localModelSettingsQueryOptions } from "./localModelSettingsQueryOptions";
import { SettingsStatusMark } from "./SettingsStatusMark";

export const ComfyVersionStatus = ({ endpoint }: { endpoint: string }) => {
  const { t } = useTranslation();
  const textModelSettings = useQuery(
    localModelSettingsQueryOptions(endpoint, "text")
  );
  const comfyVersion = textModelSettings.data?.available
    ? textModelSettings.data.comfyVersion
    : null;
  if (!comfyVersion) return null;
  const isComfyVersionSupported = isComfyVersionAtLeast(
    comfyVersion,
    REQUIRED_COMFYUI_VERSION
  );
  const versionLabel = t("localSettings.models.comfyVersion", {
    version: comfyVersion
  });
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-2">
        {isComfyVersionSupported !== null && (
          <SettingsStatusMark
            ready={isComfyVersionSupported}
            label={versionLabel}
          />
        )}
        <Text
          component="span"
          variant="xs"
          color={isComfyVersionSupported ? "success" : "glyph-secondary"}
        >
          {versionLabel}
        </Text>
      </span>
      {isComfyVersionSupported === false && (
        <Text variant="xs" color="glyph-error">
          {t("localSettings.models.comfyVersionTooOld", {
            required: REQUIRED_COMFYUI_VERSION
          })}
        </Text>
      )}
    </div>
  );
};
