import { CircularProgress } from "@components/CircularProgress";
import { useVideoAsset } from "@domains/asset/useVideoAsset";

interface PlanStepAssetVideoProps {
  assetId: string;
}

export const PlanStepAssetVideo: React.FC<PlanStepAssetVideoProps> = ({
  assetId
}) => {
  const { data, isLoading } = useVideoAsset({ assetId, enabled: true });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <CircularProgress />
      </div>
    );
  }

  const videoUrl = data && "urlToUse" in data ? data.urlToUse : undefined;
  if (!videoUrl) return null;

  return (
    <video
      src={videoUrl}
      controls
      loop
      muted
      className="rounded max-w-full max-h-80 object-contain"
    />
  );
};
