import { useAspectRatio } from "@context/AspectRatioContext";
import { useVideoFrame } from "@domains/asset/useVideoFrame";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { useOrientation } from "@hooks/preview/useOrientation";
import { Layer } from "@schemas/layer";
import { cn } from "@utils";

type Props = {
  layer: Layer;
} & React.HTMLAttributes<HTMLDivElement>;

export const ThumbnailPreview: React.FC<Props> = ({ layer }) => {
  const selectedTrackIds = useSelectedTrackIds();
  const { aspectRatio } = useAspectRatio();

  const isTrackSelected = selectedTrackIds.includes(layer.id);

  const assetId = getTrackAssetId(layer);
  const fps = getTrackAssetData(layer)?.fps;

  const { data: firstFrameImageUrl } = useVideoFrame({
    assetId: assetId,
    selectedLayerId: layer.id,
    frameNumber: 0,
    fps
  });

  const orientation = useOrientation(aspectRatio);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden h-10 min-w-6 max-w-[4.375rem] rounded-sm border bg-element-primary object-cover select-none",
        isTrackSelected
          ? "border-glyph-primary-on-pic"
          : "border-glyph-invert-main",
        !firstFrameImageUrl && "w-10 border-dashed border-glyph-disabled",
        orientation === "square" && "w-10",
        orientation === "landscape" && "w-[4.375rem]",
        orientation === "portrait" && "w-6"
      )}
    >
      {firstFrameImageUrl && (
        <img
          alt=""
          src={firstFrameImageUrl}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
};
