import { useOptimizablePrompt } from "@domains/prompt/useOptimizablePrompt";

import { RenderSettingComponentProps } from "./interface";
import { PromptWithRewriteButton } from "./PromptWithRewriteButton";

export const PromptWithEnhancePromptButton: React.FC<
  RenderSettingComponentProps<string | undefined>
> = (props) => {
  const {
    optimizePrompt,
    undoOptimizePrompt,
    isOptimizingPrompt,
    canUndoOptimizePrompt,
    optimizeRouteLabel,
    isOptimizeRoutePending
  } = useOptimizablePrompt({
    value: props.value,
    onChange: props.setValue
  });

  return (
    <PromptWithRewriteButton
      {...props}
      rewritePrompt={optimizePrompt}
      undoRewritePrompt={undoOptimizePrompt}
      isRewritingPrompt={isOptimizingPrompt}
      canUndoRewritePrompt={canUndoOptimizePrompt}
      rewriteButtonSuffix={optimizeRouteLabel}
      isRewriteButtonDisabled={isOptimizeRoutePending}
    />
  );
};
