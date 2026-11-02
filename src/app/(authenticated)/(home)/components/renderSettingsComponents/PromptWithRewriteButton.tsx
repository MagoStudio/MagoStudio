import { GhostButton } from "@components/GhostButton";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "./interface";
import { Prompt } from "./Prompt";

interface Props extends RenderSettingComponentProps<string | undefined> {
  rewritePrompt: () => void;
  undoRewritePrompt: () => void;
  isRewritingPrompt: boolean;
  canUndoRewritePrompt: boolean;
  isRewriteButtonDisabled?: boolean;
  /** Appended to the button label, e.g. "(local)" for which model runs it. */
  rewriteButtonSuffix?: string;
}

export const PromptWithRewriteButton: React.FC<Props> = ({
  rewritePrompt,
  undoRewritePrompt,
  isRewritingPrompt,
  canUndoRewritePrompt,
  isRewriteButtonDisabled,
  rewriteButtonSuffix,
  ...props
}) => {
  const { t } = useTranslation();

  const isPromptLockedWhileRewriteIsInFlight =
    props.isDisabled || isRewritingPrompt;

  return (
    <div key={props.name} className={"flex flex-col gap-2"}>
      <Prompt {...props} isDisabled={isPromptLockedWhileRewriteIsInFlight} />
      <div className="flex gap-2">
        <GhostButton
          onPress={rewritePrompt}
          loading={isRewritingPrompt}
          isDisabled={
            props.isDisabled || isRewritingPrompt || isRewriteButtonDisabled
          }
        >
          {t("actions.optimize_prompt.label")}
          {rewriteButtonSuffix && ` ${rewriteButtonSuffix}`}
        </GhostButton>
        {canUndoRewritePrompt && (
          <GhostButton
            onPress={undoRewritePrompt}
            isDisabled={props.isDisabled || isRewritingPrompt}
          >
            {t("actions.undo.label")}
          </GhostButton>
        )}
      </div>
    </div>
  );
};
