import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { RenderMode } from "@hooks/types";
import {
  Image2ImageModelDefinition,
  Img2ImgRenderResponse,
  Img2ImgSettings
} from "@models/img2img/types";
import { Project } from "@schemas/project";
import { Shot } from "@schemas/shot";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { backendApiClient } from "@/lib/backend-api-client";
import { queryKeys } from "@/queryKeys";

import { mergeImg2ImgLayerIntoProject } from "./utils/mergeImg2ImgLayerIntoProject";

interface Img2ImgRenderParams {
  settings: Img2ImgSettings;
  source_asset: string;
  timeline_id: Shot["id"];
  frame: number;
  img_file_type: string;
  renderMode: RenderMode;
  render_model: Image2ImageModelDefinition["name"];
  name?: string;
}

const addImage2ImageRender = async (
  params: Img2ImgRenderParams
): Promise<Img2ImgRenderResponse> => {
  const { renderMode, render_model, settings, ...restParams } = params;

  const response = await backendApiClient.post(`/assets/img2img/render`, {
    ...restParams,
    settings,
    render_mode: renderMode,
    render_model
  });
  return response.data;
};

export const useAddImage2ImageRender = () => {
  const queryClient = useQueryClient();
  const selectedProjectId = useSelectedProjectId();

  return useMutation({
    mutationFn: (params: Img2ImgRenderParams) => {
      return addImage2ImageRender(params);
    },
    mutationKey: ["addImage2ImageRender"],
    onSuccess: async (response) => {
      if ("error" in response) {
        console.error("Server returned error:", response.error);
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.balance.all
      });

      queryClient.setQueryData(
        queryKeys.project.byId(selectedProjectId),
        (project: Project | undefined) =>
          mergeImg2ImgLayerIntoProject(project, response)
      );

      void queryClient.invalidateQueries({
        queryKey: queryKeys.assetLibraryItems.all
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    }
  });
};
