import { useAdaptableI2vPrompt } from "@domains/prompt/useAdaptableI2vPrompt";
import { useCloudAdaptableI2vPromptFromLocal } from "@domains/prompt/useCloudAdaptableI2vPromptFromLocal";
import { useTextModelRoute } from "@domains/prompt/useTextModelRoute";
import { buildAdaptPromptReferenceAssetIds } from "@domains/prompt/utils/buildAdaptPromptReferenceAssetIds";
import { useSourceVideoAssetId } from "@domains/track/useSourceVideoAssetId";
import { useSourceVideoTrackId } from "@domains/track/useSourceVideoTrackId";
import { referenceFrameAssetIdsFromSources } from "@models/video/referenceFrameAssetIdsFromSources";
import { VideoEngine } from "@models/video/types";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";

import { RenderSettingComponentProps } from "./interface";
import { PromptWithRewriteButton } from "./PromptWithRewriteButton";

/**
 * Optimize prompt for the MiniMax reference models in the desktop app.
 *
 * The references are local assets, so where the rewrite runs decides how they
 * travel: locally they go straight to the Qwen3.8 adapter by id; on Mago cloud
 * they are mirrored first and Gemini gets the cloud ids. The text-model setting
 * picks the route (see useTextModelRoute).
 */
export const PromptWithAdaptI2vButton: React.FC<
  RenderSettingComponentProps<string | undefined>
> = (props) => {
  const { sourcesAtom } = useRenderSettingsAtoms();
  const sources = useAtomValue(sourcesAtom);
  const sourceVideoTrackId = useSourceVideoTrackId();
  const sourceVideoAssetId = useSourceVideoAssetId();
  const { route, routeLabel, isRoutePending } = useTextModelRoute();
  const isVideoReferenceEnabled =
    props.allValues?.use_video_reference !== false;
  const referenceImageAssetIds = referenceFrameAssetIdsFromSources(sources);
  const engine =
    props.specificConfig?.adaptEngine ??
    (props.allValues?.mago_engine as VideoEngine | undefined) ??
    VideoEngine.minimax_reference;

  const localReferenceAssetIds = buildAdaptPromptReferenceAssetIds({
    sourceVideoAssetId: isVideoReferenceEnabled
      ? sourceVideoAssetId
      : undefined,
    referenceImageAssetIds
  });
  const local = useAdaptableI2vPrompt({
    value: props.value,
    onChange: props.setValue,
    referenceAssetIds: localReferenceAssetIds,
    engine,
    route: "local"
  });

  const cloudSourceVideoTrackId = isVideoReferenceEnabled
    ? sourceVideoTrackId
    : undefined;
  const cloud = useCloudAdaptableI2vPromptFromLocal({
    value: props.value,
    onChange: props.setValue,
    sourceVideoTrackId: cloudSourceVideoTrackId,
    referenceImageAssetIds,
    cloudEngine: engine
  });

  const active = route === "local" ? local : cloud;
  const hasAnyReference =
    route === "local"
      ? localReferenceAssetIds.length > 0
      : !!cloudSourceVideoTrackId || referenceImageAssetIds.length > 0;

  return (
    <PromptWithRewriteButton
      {...props}
      rewritePrompt={active.adaptPrompt}
      undoRewritePrompt={active.undoAdaptPrompt}
      isRewritingPrompt={active.isAdaptingPrompt}
      canUndoRewritePrompt={active.canUndoAdaptPrompt}
      isRewriteButtonDisabled={isRoutePending || !hasAnyReference}
      rewriteButtonSuffix={routeLabel}
    />
  );
};
