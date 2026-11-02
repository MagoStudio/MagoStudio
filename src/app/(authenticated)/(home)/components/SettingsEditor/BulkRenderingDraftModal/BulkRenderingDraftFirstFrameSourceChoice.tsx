import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { BulkRenderingFirstFrameSource } from "@store/atoms";
import { useTranslation } from "react-i18next";

export function BulkRenderingDraftFirstFrameSourceChoice({
  onChoose
}: {
  onChoose: (firstFrameSource: BulkRenderingFirstFrameSource) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex max-w-[760px] flex-col items-start justify-center gap-4 rounded-lg border border-glyph-stroke-2 p-5">
        <Text
          component="p"
          variant="md"
          weight="bold"
          color="glyph-primary"
          whiteSpace="pre-line"
        >
          {t("bulk_rendering.first_frame_source_choice_title.label")}
        </Text>
        <div className="flex gap-2">
          <MainButton
            colorScheme="primary"
            onPress={() => onChoose("generated")}
          >
            {t(
              "bulk_rendering.first_frame_source_choice_generate_button.label"
            )}
          </MainButton>
          <MainButton
            colorScheme="primary"
            onPress={() => onChoose("uploaded")}
          >
            {t("bulk_rendering.first_frame_source_choice_upload_button.label")}
          </MainButton>
        </div>
      </div>
    </div>
  );
}
