import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { filterEligibleLayers } from "@domains/track/utils/trackEligibility";
import { LayerType } from "@schemas/layer";
import { Project } from "@schemas/project";

export const deriveProjectTracks = (project: Project): Project => ({
  ...project,
  timelines:
    project.timelines?.map((shot) => {
      const filteredLayers = filterEligibleLayers(shot.layers);

      const imageLayer = filteredLayers.find(
        (layer) => layer.type === LayerType.IMAGE
      );
      const sourceFps = getTrackAssetData(imageLayer)?.fps;
      const hasSourceFps = typeof sourceFps === "number" && sourceFps > 0;

      const layersWithFps = hasSourceFps
        ? filteredLayers.map((layer) => {
            if (layer.type !== LayerType.RENDER) return layer;
            return {
              ...layer,
              clips: layer.clips.map((clip) => ({
                ...clip,
                asset: {
                  ...clip.asset,
                  data: { ...clip.asset.data, fps: sourceFps }
                }
              }))
            };
          })
        : filteredLayers;

      return { ...shot, layers: layersWithFps };
    }) ?? []
});
