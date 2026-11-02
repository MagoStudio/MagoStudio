import { useAdaptableI2vPrompt } from "@domains/prompt/useAdaptableI2vPrompt";
import { buildAdaptPromptReferenceAssetIds } from "@domains/prompt/utils/buildAdaptPromptReferenceAssetIds";
import { useSourceVideoAssetId } from "@domains/track/useSourceVideoAssetId";
import { referenceFrameAssetIdsFromSources } from "@models/video/referenceFrameAssetIdsFromSources";
import { VideoEngine } from "@models/video/types";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";

import { RenderSettingComponentProps } from "./interface";
import { PromptWithRewriteButton } from "./PromptWithRewriteButton";

export const PromptWithAdaptI2vButton: React.FC<
  RenderSettingComponentProps<string | undefined>
> = (props) => {
  const { sourcesAtom } = useRenderSettingsAtoms();
  const sources = useAtomValue(sourcesAtom);
  const sourceVideoAssetId = useSourceVideoAssetId();
  const isVideoReferenceEnabled =
    props.allValues?.use_video_reference !== false;

  const referenceAssetIds = buildAdaptPromptReferenceAssetIds({
    sourceVideoAssetId: isVideoReferenceEnabled
      ? sourceVideoAssetId
      : undefined,
    referenceImageAssetIds: referenceFrameAssetIdsFromSources(sources)
  });

  const { adaptPrompt, undoAdaptPrompt, isAdaptingPrompt, canUndoAdaptPrompt } =
    useAdaptableI2vPrompt({
      value: props.value,
      onChange: props.setValue,
      referenceAssetIds,
      engine: props.allValues?.mago_engine as VideoEngine
    });

  return (
    <PromptWithRewriteButton
      {...props}
      rewritePrompt={adaptPrompt}
      undoRewritePrompt={undoAdaptPrompt}
      isRewritingPrompt={isAdaptingPrompt}
      canUndoRewritePrompt={canUndoAdaptPrompt}
      isRewriteButtonDisabled={referenceAssetIds.length === 0}
    />
  );
};
