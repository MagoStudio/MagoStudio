import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { ShotVersionComments } from "@domains/scriptProject/useShotVersionComments";
import { useTranslation } from "react-i18next";

import { useAppendScoringReviewToVersionNotes } from "./hooks/useAppendScoringReviewToVersionNotes";

const REVIEW_NOTE_FIELDS = ["bad", "todo"] as const;

type Props = {
  assetId: string;
  hasRenderFinished: boolean;
  comments: ShotVersionComments;
  onChangeComment: (
    field: (typeof REVIEW_NOTE_FIELDS)[number],
    comment: string
  ) => void;
  appendScoringReview: (
    assetId: string,
    issues: string[],
    nextPrompt: string | null
  ) => void;
};

export const CutShotVersionReviewNotes: React.FC<Props> = ({
  assetId,
  hasRenderFinished,
  comments,
  onChangeComment,
  appendScoringReview
}) => {
  const { t } = useTranslation();
  useAppendScoringReviewToVersionNotes({
    assetId,
    hasRenderFinished,
    appendScoringReview
  });

  return REVIEW_NOTE_FIELDS.map((field) => (
    <label key={field} className="flex flex-col gap-1">
      <Text variant="2xs" color="glyph-tertiary">
        {t(`script_project.version_review_${field}.label`)}
      </Text>
      <Textarea
        autoResize
        resize="vertical"
        className="min-h-14"
        value={comments[field]}
        onChange={(event) => onChangeComment(field, event.target.value)}
        placeholder={t(`script_project.version_review_${field}.placeholder`)}
        data-testid={`cut-version-review-${field}-${assetId}`}
      />
    </label>
  ));
};
