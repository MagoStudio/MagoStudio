import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { SELECTED_TRACK_IDS_URL_PARAM } from "@domains/track/selectedTrackIdsUrlParam";
import { TOOL_URL_PARAM } from "@hooks/tool/useTool";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useShallowRouter } from "@hooks/useShallowRouter";
import { setSearchParam } from "@utils/url/setSearchParam";
import { usePathname } from "next/navigation";

export const useOpenImageToVideoModal = () => {
  const projectId = useSelectedProjectId();
  const pathname = usePathname();
  const shallowRouter = useShallowRouter();

  const openImageToVideoModal = () => {
    if (!projectId) return;

    const withTool = setSearchParam(
      window.location.search,
      TOOL_URL_PARAM,
      "image-to-video"
    );
    const withoutSelectedTrack = setSearchParam(
      withTool,
      SELECTED_TRACK_IDS_URL_PARAM,
      undefined
    );

    shallowRouter.replace(`${pathname}?${withoutSelectedTrack}`);
    trackingUtils.imageToVideoActions.modalOpen({ source: "add-cell" });
  };

  return { openImageToVideoModal };
};
