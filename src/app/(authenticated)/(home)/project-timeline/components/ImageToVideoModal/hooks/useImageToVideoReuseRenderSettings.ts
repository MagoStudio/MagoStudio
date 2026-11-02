import { useImageAsset } from "@domains/asset/useImageAsset";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { Layer } from "@schemas/layer";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useSetAtom } from "jotai";

import { buildImageToVideoPrefillSettings } from "../utils/buildImageToVideoPrefillSettings";

export const useImageToVideoReuseRenderSettings = (
  track: Layer | undefined
) => {
  const startImageAssetId = getTrackRenderSettings(track)?.image_id;
  const resolvedStartImageAssetId =
    typeof startImageAssetId === "string" ? startImageAssetId : undefined;
  const { data: startImageAsset, isLoading: isStartImageAssetLoading } =
    useImageAsset({
      assetId: resolvedStartImageAssetId,
      enabled: !!resolvedStartImageAssetId
    });
  const { loadSettingsAtom } = useRenderSettingsAtoms();
  const loadSettings = useSetAtom(loadSettingsAtom);

  const isStartImageAssetResolved =
    !resolvedStartImageAssetId || !isStartImageAssetLoading;

  const reuseSettings = () => {
    if (!track) return;
    const prefillSettings = buildImageToVideoPrefillSettings(
      track,
      startImageAsset
    );
    if (!prefillSettings) return;

    loadSettings({
      values: prefillSettings,
      sources: [],
      targetTool: "image-to-video"
    });
  };

  return { reuseSettings, isStartImageAssetResolved };
};
