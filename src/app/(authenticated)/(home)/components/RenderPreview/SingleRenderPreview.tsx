import { TrackPreviewContainer } from "@home/components/VideoPreview";
import { Layer } from "@schemas/layer";

interface Props {
  track: Layer | undefined;
}

export const SingleRenderPreview: React.FC<Props> = ({ track }) => {
  return (
    <div className="flex flex-col h-full w-full justify-between">
      <TrackPreviewContainer selectedTrack={track} />
    </div>
  );
};
