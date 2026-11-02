import { VideoEngine } from "@models/video/types";

import { usePostAdaptI2vPrompt } from "./data/usePostAdaptI2vPrompt";
import { TextModelRoute } from "./useTextModelRoute";
import { useUndoablePromptRewrite } from "./useUndoablePromptRewrite";

export const useAdaptableI2vPrompt = ({
  value,
  onChange,
  referenceAssetIds,
  engine,
  route
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  referenceAssetIds: string[];
  engine: VideoEngine;
  route?: TextModelRoute;
}) => {
  const { mutateAsync: adaptI2vPrompt, isPending: isAdaptingPrompt } =
    usePostAdaptI2vPrompt(route);

  const {
    rewritePrompt: adaptPrompt,
    undoRewritePrompt: undoAdaptPrompt,
    canUndoRewritePrompt: canUndoAdaptPrompt
  } = useUndoablePromptRewrite({
    value,
    onChange,
    rewritePrompt: (prompt) =>
      adaptI2vPrompt({
        prompt,
        reference_asset_ids: referenceAssetIds,
        engine
      }),
    rewriteFailedMessageKey: "notifications.adapt_prompt_failed.description"
  });

  return {
    adaptPrompt,
    undoAdaptPrompt,
    isAdaptingPrompt,
    canUndoAdaptPrompt
  };
};
