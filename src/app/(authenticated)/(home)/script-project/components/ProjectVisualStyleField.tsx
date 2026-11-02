import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { MAX_PROJECT_VISUAL_STYLE_LENGTH } from "@domains/scriptProject/constants";
import { useProjectVisualStyle } from "@domains/scriptProject/useProjectVisualStyle";
import { readProjectSettingsRejectionMessage } from "@domains/scriptProject/utils/readProjectSettingsRejectionMessage";
import { useDraftValue } from "@hooks/useDraftValue";
import { useTranslation } from "react-i18next";

type Props = {
  projectId: string;
};

export const ProjectVisualStyleField: React.FC<Props> = ({ projectId }) => {
  const { t } = useTranslation();
  const { visualStyleShownInField, commitVisualStyle, visualStyleSaveFailure } =
    useProjectVisualStyle(projectId);
  const {
    draftValue: draftVisualStyle,
    setDraftValue: setDraftVisualStyle,
    isDraftDirty: isVisualStyleDraftDirty
  } = useDraftValue(visualStyleShownInField);

  const hasVisualStyleSaveFailed = visualStyleSaveFailure !== null;
  const shouldCommitVisualStyleOnBlur =
    isVisualStyleDraftDirty || hasVisualStyleSaveFailed;
  const visualStyleSaveErrorMessage = hasVisualStyleSaveFailed
    ? (readProjectSettingsRejectionMessage(visualStyleSaveFailure.error) ??
      t("script_project.visual_style_input.save_error"))
    : null;

  return (
    <label className="flex w-full max-w-[780px] flex-col gap-1.5">
      <Text component="span" variant="xs" color="glyph-secondary">
        {t("script_project.visual_style_input.label")}
      </Text>
      <Textarea
        className="min-h-16"
        autoResize
        resize="vertical"
        maxLength={MAX_PROJECT_VISUAL_STYLE_LENGTH}
        placeholder={t("script_project.visual_style_input.placeholder")}
        severity={hasVisualStyleSaveFailed ? "error" : undefined}
        value={draftVisualStyle}
        onChange={(event) => setDraftVisualStyle(event.target.value)}
        onBlur={() => {
          if (!shouldCommitVisualStyleOnBlur) return;
          commitVisualStyle(draftVisualStyle);
        }}
        data-testid="script-project-visual-style"
      />
      {visualStyleSaveErrorMessage ? (
        <Text component="span" variant="2xs" color="glyph-error">
          {visualStyleSaveErrorMessage}
        </Text>
      ) : (
        <Text component="span" variant="2xs" color="glyph-tertiary">
          {t("script_project.visual_style_input.hint")}
        </Text>
      )}
    </label>
  );
};
