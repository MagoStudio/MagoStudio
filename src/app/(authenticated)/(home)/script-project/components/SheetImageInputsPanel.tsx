import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useSheetImageInputs } from "@domains/scriptProject/useSheetImageInputs";
import { readSheetImageSetting } from "@domains/scriptProject/utils/readSheetImageSetting";
import { useTranslation } from "react-i18next";

import { SheetImageDescription } from "./SheetImageDescription";

type Props = {
  clipId: string;
  assetId: string;
  description: string | null | undefined;
  hasDescription: boolean;
  seedDescription: string;
  recordedPrompt: string | null | undefined;
  versionName: string;
  isBusy: boolean;
  shouldFetchInputs: boolean;
  onReusePrompt: (prompt: string) => void;
  onDescribeFromImage: () => void;
};

export const SheetImageInputsPanel: React.FC<Props> = ({
  clipId,
  assetId,
  description,
  hasDescription,
  seedDescription,
  recordedPrompt,
  versionName,
  isBusy,
  shouldFetchInputs,
  onReusePrompt,
  onDescribeFromImage
}) => {
  const { t } = useTranslation();
  const { data: inputs, isPending } = useSheetImageInputs(
    clipId,
    shouldFetchInputs
  );

  const settings = inputs?.data?.settings;
  const renderPrompt =
    readSheetImageSetting(settings, "prompt") ?? recordedPrompt ?? null;
  const renderModel = readSheetImageSetting(settings, "render_model");
  const width = readSheetImageSetting(settings, "width");
  const height = readSheetImageSetting(settings, "height");

  return (
    <div
      data-testid={`sheet-image-inputs-${clipId}`}
      className="flex flex-col gap-2 rounded-xl border border-element-primary bg-surface-primary p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <Text variant="xs" weight="semibold" color="glyph-secondary">
          {t("script_project.image_inputs_title.label", {
            version: versionName
          })}
        </Text>
        {renderPrompt && (
          <MainButton
            size="sm"
            colorScheme="secondary"
            isDisabled={isBusy}
            onPress={() => onReusePrompt(renderPrompt)}
            aria-label={t("script_project.reuse_settings_button.ariaLabel")}
            data-testid={`sheet-image-reuse-${clipId}`}
          >
            {t("script_project.reuse_settings_button.label")}
          </MainButton>
        )}
      </div>

      {isPending ? (
        <Text variant="xs" color="glyph-tertiary">
          {t("script_project.image_inputs_loading.label")}
        </Text>
      ) : (
        <div className="flex flex-col gap-1">
          {renderModel && (
            <Text variant="2xs" color="glyph-tertiary">
              {t("script_project.image_inputs_model.label", {
                model: renderModel
              })}
            </Text>
          )}
          {width && height && (
            <Text variant="2xs" color="glyph-tertiary">
              {t("script_project.image_inputs_size.label", { width, height })}
            </Text>
          )}
          {renderPrompt ? (
            <Text variant="xs" color="glyph-secondary" whiteSpace="pre-wrap">
              {renderPrompt}
            </Text>
          ) : (
            <Text variant="xs" color="glyph-tertiary">
              {t("script_project.image_inputs_missing.label")}
            </Text>
          )}
        </div>
      )}

      <SheetImageDescription
        assetId={assetId}
        description={description}
        hasDescription={hasDescription}
        seedDescription={seedDescription}
        isBusy={isBusy}
        onDescribeFromImage={onDescribeFromImage}
      />
    </div>
  );
};
