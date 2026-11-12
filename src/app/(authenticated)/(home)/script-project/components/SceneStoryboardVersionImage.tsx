import { useCachedOrProxiedImageUrl } from "@domains/asset/useCachedOrProxiedImageUrl";

type Props = {
  versionImageUrl: string;
  versionAssetId: string;
};

export const SceneStoryboardVersionImage: React.FC<Props> = ({
  versionImageUrl,
  versionAssetId
}) => {
  const readableVersionImageUrl = useCachedOrProxiedImageUrl(
    versionImageUrl,
    versionAssetId
  );
  return (
    <img
      alt=""
      src={readableVersionImageUrl}
      className="h-full w-full object-contain"
    />
  );
};
