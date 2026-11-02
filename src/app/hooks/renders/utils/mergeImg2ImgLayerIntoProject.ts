import { Img2ImgRenderResponse } from "@models/img2img/types";
import { Layer, LayerType } from "@schemas/layer";
import { Project } from "@schemas/project";

export const mergeImg2ImgLayerIntoProject = (
  project: Project | undefined,
  response: Img2ImgRenderResponse
): Project | undefined => {
  if (!project) return project;

  const shot = project.timelines?.find((s) => s.id === response.timeline_id);
  if (!shot) return project;

  const now = new Date();
  const newClips = response.clips.map((clip) => ({
    ...clip,
    asset: { ...clip.asset, created_at: now }
  })) as unknown as Layer["clips"];
  const hasExistingLayer = shot.layers.some(
    (layer) => layer.id === response.id
  );

  const updatedLayers = hasExistingLayer
    ? shot.layers.map((layer) =>
        layer.id === response.id
          ? { ...layer, clips: [...layer.clips, ...newClips] }
          : layer
      )
    : [
        ...shot.layers,
        {
          id: response.id,
          timeline_id: response.timeline_id,
          user_id: response.user_id,
          type: LayerType.IMG2IMG,
          name: "",
          active: true,
          muted: false,
          visible: true,
          layer_order: shot.layers.length + 1,
          rating: 0,
          created_at: new Date(),
          data: {},
          clips: newClips
        } as Layer
      ];

  return {
    ...project,
    timelines: project.timelines?.map((s) =>
      s.id === shot.id ? { ...s, layers: updatedLayers } : s
    )
  };
};
