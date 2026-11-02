import { useEnhancePrompt } from "./useEnhancePrompt";
import { useUndoablePromptRewrite } from "./useUndoablePromptRewrite";

export const useOptimizablePrompt = ({
  value,
  onChange
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) => {
  const {
    mutateAsync: enhancePrompt,
    isPending: isEnhancingPrompt,
    routeLabel,
    isRoutePending
  } = useEnhancePrompt();

  const {
    rewritePrompt: optimizePrompt,
    undoRewritePrompt: undoOptimizePrompt,
    canUndoRewritePrompt: canUndoOptimizePrompt
  } = useUndoablePromptRewrite({
    value,
    onChange,
    rewritePrompt: (prompt) => enhancePrompt({ query: prompt }),
    rewriteFailedMessageKey: "notifications.optimize_prompt_failed.description"
  });

  return {
    optimizePrompt,
    undoOptimizePrompt,
    isOptimizingPrompt: isEnhancingPrompt,
    canUndoOptimizePrompt,
    optimizeRouteLabel: routeLabel,
    isOptimizeRoutePending: isRoutePending
  };
};
