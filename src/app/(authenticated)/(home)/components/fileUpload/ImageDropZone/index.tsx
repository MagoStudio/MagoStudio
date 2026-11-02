import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

interface Props {
  disabled?: boolean;
  label?: string;
  subtitle?: string;
}

export const ImageDropZone: React.FC<Props> = ({
  disabled = false,
  label,
  subtitle
}) => {
  const { t } = useTranslation();
  const { sourcesAtom, selectedModelAtom } = useRenderSettingsAtoms();
  const sources = useAtomValue(sourcesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);

  const hasReferenceImage = sources.some(
    (entry) => entry.type === "reference_frame"
  );
  const isImageRequiredForWanModel =
    selectedModel?.isSourceImageRequired && !hasReferenceImage;

  const defaultLabel = isImageRequiredForWanModel
    ? t("actions.upload_stylized_frame.label")
    : t("notifications.upload_image_file.description");

  const title = label ? label : defaultLabel;

  const defaultSubtitle = isImageRequiredForWanModel
    ? t("notifications.use_image_format_short.description")
    : t("notifications.use_image_format.description");

  const subtitleText = subtitle ? subtitle : defaultSubtitle;

  return (
    <>
      <Icon iconSet="24" iconName="upload" />
      <Text
        align="center"
        className="max-w-full wrap-break-word"
        disabled={disabled}
        select="none"
      >
        {title}
      </Text>
      <Text
        align="center"
        className="max-w-full wrap-break-word"
        color="glyph-tertiary"
        disabled={disabled}
        select="none"
        variant="sm"
      >
        {subtitleText}
      </Text>
    </>
  );
};
