import { Text } from "@components/Text";
import { PERCENTAGE_MULTIPLIER } from "@constants";
import { toNormalizedCropRect } from "@domains/renders/utils/cropRect";
import { getInputVideoDimensions } from "@domains/renders/utils/getInputVideoDimensions";
import { getTrackCropSettings } from "@domains/track/utils/getTrackCropSettings";
import { VideoMediaPlayer } from "@home/components/VideoPreview/VideoMediaPlayer";
import { ViewportPanZoom } from "@home/components/VideoPreview/ViewportPanZoom";
import { Layer } from "@schemas/layer";
import { viewportPanZoomAtom } from "@store/atoms";
import { computeObjectContainBox } from "@utils/video/computeObjectContainBox";
import { useAtomValue } from "jotai";

const NOOP_SET_IS_LOADING = (): void => {};

interface CroppedRenderCompositeViewProps {
  inputVideoTrack: Layer;
  renderTrack: Layer;
}

export const CroppedRenderCompositeView: React.FC<
  CroppedRenderCompositeViewProps
> = ({ inputVideoTrack, renderTrack }) => {
  const viewport = useAtomValue(viewportPanZoomAtom);
  const { inputVideoWidth, inputVideoHeight } =
    getInputVideoDimensions(inputVideoTrack);
  const cropSettings = getTrackCropSettings(renderTrack);

  if (!inputVideoWidth || !inputVideoHeight || !cropSettings) return null;

  const [sourceWidth, sourceHeight] = cropSettings.sourceVideoDimensions;
  const normalizedCrop = toNormalizedCropRect({
    crop: cropSettings.cropCoordinates,
    sourceWidth,
    sourceHeight
  });

  const contentBox = computeObjectContainBox({
    containerWidth: viewport.viewportWidth,
    containerHeight: viewport.viewportHeight,
    mediaWidth: inputVideoWidth,
    mediaHeight: inputVideoHeight
  });

  return (
    <div className="w-full h-full relative">
      <ViewportPanZoom>
        <VideoMediaPlayer
          key={inputVideoTrack.id}
          isLoading={false}
          setIsLoading={NOOP_SET_IS_LOADING}
          selectedLayer={inputVideoTrack}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            left: contentBox.left,
            top: contentBox.top,
            width: contentBox.width,
            height: contentBox.height
          }}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          />

          <div
            data-testid="cropped-render-inset"
            className="absolute overflow-hidden border border-element-error rounded-xs"
            style={{
              left: `${normalizedCrop.x * PERCENTAGE_MULTIPLIER}%`,
              top: `${normalizedCrop.y * PERCENTAGE_MULTIPLIER}%`,
              width: `${normalizedCrop.width * PERCENTAGE_MULTIPLIER}%`,
              height: `${normalizedCrop.height * PERCENTAGE_MULTIPLIER}%`
            }}
          >
            <VideoMediaPlayer
              key={renderTrack.id}
              isLoading={false}
              setIsLoading={NOOP_SET_IS_LOADING}
              selectedLayer={renderTrack}
            />
          </div>

          <div
            data-testid="cropped-render-label"
            className="absolute -translate-y-full pb-1"
            style={{
              left: `${normalizedCrop.x * PERCENTAGE_MULTIPLIER}%`,
              top: `${(normalizedCrop.y + normalizedCrop.height) * PERCENTAGE_MULTIPLIER}%`
            }}
          >
            <Text
              component="span"
              variant="sm"
              color="glyph-primary-on-pic"
              className="whitespace-nowrap px-2 py-1"
            >
              {renderTrack.name}
            </Text>
          </div>
        </div>
      </ViewportPanZoom>
    </div>
  );
};
