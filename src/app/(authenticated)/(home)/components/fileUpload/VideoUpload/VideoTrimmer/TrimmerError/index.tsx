import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

interface TrimmerErrorProps {
  error: string;
  variant?: "validation" | "processing";
  onClearFile?: () => void;
}

export const TrimmerError: React.FC<TrimmerErrorProps> = ({
  error,
  variant = "validation",
  onClearFile
}) => {
  const { t } = useTranslation();

  const getErrorMessage = (): string => {
    if (variant === "processing") {
      return typeof error === "string" ? error : "";
    }

    switch (error) {
      case "video_too_short":
        return t("notifications.video_too_short.description");
      case "not_a_video_file":
        return t("notifications.not_a_video_file.description");
      case "undefined_duration":
        return t("notifications.undefined_duration.description");
      case "container_format_mismatch":
        return t("notifications.container_format_mismatch.description");
      default:
        return error?.toString() || "";
    }
  };

  const getErrorTitle = (): string => {
    return variant === "processing"
      ? t("status.processing_failed.label")
      : t("status.error.label");
  };

  if (!error) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto gap-2 text-center p-4">
      <Text variant="md" color="glyph-error">
        {getErrorTitle()}
      </Text>
      <Text variant="sm" color="glyph-secondary">
        {getErrorMessage()}
      </Text>
      {onClearFile && (
        <MainButton className="mt-4" onPress={onClearFile}>
          {t("actions.try_another_video.label")}
        </MainButton>
      )}
    </div>
  );
};
