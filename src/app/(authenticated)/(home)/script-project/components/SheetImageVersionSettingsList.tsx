import { Text } from "@components/Text";
import { SheetImageVersionSettings } from "@domains/scriptProject/utils/readSheetImageVersionSettings";
import { useTranslation } from "react-i18next";

import { VersionReferenceImages } from "./VersionReferenceImages";
import { VersionSettingRow } from "./VersionSettingRow";

type Props = {
  versionSettings: SheetImageVersionSettings | null;
};

export const SheetImageVersionSettingsList: React.FC<Props> = ({
  versionSettings
}) => {
  const { t } = useTranslation();

  if (!versionSettings)
    return (
      <Text variant="xs" color="glyph-tertiary">
        {t("script_project.image_inputs_missing.label")}
      </Text>
    );

  const {
    prompt,
    sheetRenderModel,
    outputSize,
    referenceAssetIds,
    referenceInstruction,
    visualStyle
  } = versionSettings;

  return (
    <div className="flex flex-col gap-2">
      {prompt && (
        <VersionSettingRow
          label={t("script_project.entity_prompt_input.label")}
        >
          {prompt}
        </VersionSettingRow>
      )}
      {referenceAssetIds.length > 0 && (
        <VersionSettingRow label={t("script_project.asset_references.label")}>
          <VersionReferenceImages assetIds={referenceAssetIds} />
        </VersionSettingRow>
      )}
      {referenceInstruction && (
        <VersionSettingRow
          label={t("script_project.asset_references.instruction")}
        >
          {referenceInstruction}
        </VersionSettingRow>
      )}
      {sheetRenderModel && (
        <VersionSettingRow
          label={t("script_project.sheet_render_model_input.label")}
        >
          {t(`script_project.sheet_render_model_${sheetRenderModel}.label`)}
        </VersionSettingRow>
      )}
      {outputSize && (
        <VersionSettingRow
          label={t("script_project.version_settings_size.label")}
        >
          {t("script_project.version_settings_size.value", {
            width: outputSize[0],
            height: outputSize[1]
          })}
        </VersionSettingRow>
      )}
      {visualStyle && (
        <VersionSettingRow label={t("script_project.visual_style_input.label")}>
          {visualStyle}
        </VersionSettingRow>
      )}
    </div>
  );
};
