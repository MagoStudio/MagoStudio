import { getAssetDimensions } from "@domains/asset/utils/getAssetDimensions";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";

type Props = {
  children: React.ReactNode;
};

export const PreviewContainer: React.FC<Props> = ({ children }) => {
  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();

  const { width, height } = getAssetDimensions(getTrackAssetData(videoTrack));

  if (!width || !height || width === 0 || height === 0) {
    return null;
  }

  const aspectRatio = width / height;

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div
        className={
          "flex flex-col items-center justify-center bg-surface-bg-300 p-6 w-full h-auto"
        }
        style={{
          aspectRatio: aspectRatio.toString()
        }}
      >
        {children}
      </div>
    </div>
  );
};
