import { Icon } from "@components/Icon";
import { Input } from "@components/Input";
import { useTranslation } from "react-i18next";

export function BulkRenderingDraftFrameSelection({
  frameNumber,
  maxFrameNumber,
  onFrameNumberChange
}: {
  frameNumber: number;
  maxFrameNumber: number;
  onFrameNumberChange: (frameNumber: number) => void;
}) {
  const { t } = useTranslation();

  const commitFrameNumber = (candidateFrameNumber: number) => {
    if (Number.isNaN(candidateFrameNumber)) return;
    if (candidateFrameNumber < 0) return;
    if (candidateFrameNumber > maxFrameNumber) return;
    onFrameNumberChange(candidateFrameNumber);
  };

  return (
    <Input
      className="w-full min-w-20"
      type="number"
      min={0}
      max={maxFrameNumber}
      value={frameNumber}
      labelInside={t("bulk_rendering.draft_shot_card_frame_label.label")}
      aria-label={t("bulk_rendering.draft_shot_card_frame_label.label")}
      preserveEmptyWhileFocused
      selectAllTextOnFocus
      onChange={(e) => {
        if (e.target.value.trim() === "") return;
        commitFrameNumber(Number(e.target.value));
      }}
      onBlur={(e) => {
        if (e.target.value.trim() === "") {
          commitFrameNumber(0);
          return;
        }
        commitFrameNumber(Number(e.target.value));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      labelInsideEndAdornment={
        <span className="flex items-center p-1 opacity-50">
          <Icon
            iconSet="16-filled"
            iconName="info"
            className="text-glyph-tertiary"
            aria-label={t(
              "bulk_rendering.draft_shot_card_frame_info.ariaLabel"
            )}
          />
        </span>
      }
    />
  );
}
