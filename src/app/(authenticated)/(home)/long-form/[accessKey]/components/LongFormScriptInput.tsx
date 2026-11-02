import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { LoadingIndicator } from "@components/LoadingIndicator";
import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { isLongFormRunUnsettled } from "@domains/longFormRun/utils/isLongFormRunUnsettled";
import { useCancelPlan } from "@domains/plan/useCancelPlan";
import { PlanStatus } from "@schemas/plan";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface LongFormScriptInputProps {
  runId: string | undefined;
  runStatus: PlanStatus | undefined;
  isSubmitting: boolean;
  didSubmissionFail: boolean;
  onSubmit: (script: string) => void;
}

export const LongFormScriptInput: React.FC<LongFormScriptInputProps> = ({
  runId,
  runStatus,
  isSubmitting,
  didSubmissionFail,
  onSubmit
}) => {
  const { t } = useTranslation();
  const [script, setScript] = useState("");
  const { mutate: cancelRun, isPending: isCancellingRun } = useCancelPlan();

  const isRunUnsettled = !!runId && isLongFormRunUnsettled(runStatus);
  const canSubmit =
    !isSubmitting && !isRunUnsettled && script.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(script);
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2"
      data-testid="long-form-script-input"
    >
      <div className="relative grid min-h-0 flex-1 shadow-2xl">
        <Textarea
          data-testid="long-form-script-textarea"
          className="h-full rounded-xl border-glyph-stroke py-3 pr-11 pl-3 text-glyph-primary"
          placeholder={t("longForm.scriptPlaceholder.label")}
          value={script}
          disabled={isSubmitting || isRunUnsettled}
          onChange={(event) => setScript(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            handleSubmit();
          }}
        />
        <div className="absolute right-2 bottom-2">
          {isSubmitting ? (
            <IconActionButton
              aria-label={t("longForm.submit.label")}
              icon={
                <LoadingIndicator
                  size="16"
                  className="text-glyph-primary-on-pic"
                />
              }
              isDisabled
            />
          ) : isRunUnsettled ? (
            <IconActionButton
              data-testid="long-form-cancel"
              aria-label={t("longForm.cancel.label")}
              icon={<Icon iconSet="16" iconName="stop" />}
              loading={isCancellingRun}
              onPress={() => runId && cancelRun(runId)}
            />
          ) : (
            <IconActionButton
              data-testid="long-form-submit"
              aria-label={t("longForm.submit.label")}
              icon={<Icon iconSet="16" iconName="return" />}
              isDisabled={!canSubmit}
              onPress={handleSubmit}
            />
          )}
        </div>
      </div>
      {didSubmissionFail && (
        <Text component="span" variant="sm" color="glyph-error">
          {t("longForm.submitFailed.label")}
        </Text>
      )}
    </div>
  );
};
