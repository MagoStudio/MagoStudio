import { useGetImg2ImgRenderStatus } from "../../components/Navbar/Img2ImgModalV2/hooks/useGetImg2ImgRenderStatus";

type Props = {
  generatingClipId: string;
};

export const SceneStoryboardRenderPoller: React.FC<Props> = ({
  generatingClipId
}) => {
  useGetImg2ImgRenderStatus({ clipId: generatingClipId });
  return null;
};
