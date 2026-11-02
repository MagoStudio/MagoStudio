import { Dropdown } from "@components/Dropdown";
import { Text } from "@components/Text";
import {
  SCRIPT_PROJECT_ASPECT_RATIOS,
  SCRIPT_PROJECT_RESOLUTIONS,
  ScriptProjectAspectRatioId,
  ScriptProjectResolutionId
} from "@domains/scriptProject/constants";
import {
  buildOutputSize,
  matchOutputSize
} from "@domains/scriptProject/utils/buildOutputSize";
import { useTranslation } from "react-i18next";

type Props = {
  outputSize: [number, number];
  isDisabled: boolean;
  onChange: (outputSize: [number, number]) => void;
  isAspectRatioHidden?: boolean;
  isResolutionHidden?: boolean;
};

export const ProjectOutputSizeControls: React.FC<Props> = ({
  outputSize,
  isDisabled,
  onChange,
  isAspectRatioHidden = false,
  isResolutionHidden = false
}) => {
  const { t } = useTranslation();
  const { aspectRatioId, resolutionId } = matchOutputSize(outputSize);
  const offeredResolutionId: ScriptProjectResolutionId =
    resolutionId === "768p" ? "720p" : resolutionId;

  return (
    <div className="flex flex-wrap items-end gap-3">
      {!isAspectRatioHidden && (
        <label className="flex flex-col gap-1">
          <Text variant="xs" color="glyph-secondary">
            {t("script_project.aspect_ratio_input.label")}
          </Text>
          <Dropdown
            aria-label={t("script_project.aspect_ratio_input.label")}
            isDisabled={isDisabled}
            selectedKey={aspectRatioId}
            items={SCRIPT_PROJECT_ASPECT_RATIOS.map((ratio) => ({
              key: ratio.id,
              label: ratio.id
            }))}
            onSelectionChange={(key) =>
              onChange(
                buildOutputSize(
                  String(key) as ScriptProjectAspectRatioId,
                  offeredResolutionId
                )
              )
            }
            className="w-28"
            data-testid="script-project-aspect-ratio"
          />
        </label>
      )}

      {!isResolutionHidden && (
        <label className="flex flex-col gap-1">
          <Dropdown
            aria-label={t("script_project.resolution_input.label")}
            isDisabled={isDisabled}
            selectedKey={offeredResolutionId}
            items={SCRIPT_PROJECT_RESOLUTIONS.filter(
              (resolution) => resolution.id !== "768p"
            ).map((resolution) => ({
              key: resolution.id,
              label: resolution.id
            }))}
            onSelectionChange={(key) =>
              onChange(
                buildOutputSize(
                  aspectRatioId,
                  String(key) as ScriptProjectResolutionId
                )
              )
            }
            className="w-28"
            data-testid="script-project-resolution"
          />
        </label>
      )}
    </div>
  );
};
