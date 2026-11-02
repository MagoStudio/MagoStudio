import { InlineEditableText } from "@components/InlineEditableText";
import { Text } from "@components/Text";
import { MAX_TRACK_NAME_LENGTH } from "@constants";
import { useUpdateTrack } from "@domains/track/useUpdateTrack";
import { getStatusColor } from "@home/components/status/getStatusColor";
import { AssetStatus } from "@schemas/asset";
import { Layer } from "@schemas/layer";

interface ImageToVideoRenderHeaderProps {
  track: Layer;
  containerShotId: string | undefined;
  status: AssetStatus | undefined;
  statusText: string | undefined;
}

export const ImageToVideoRenderHeader: React.FC<
  ImageToVideoRenderHeaderProps
> = ({ track, containerShotId, status, statusText }) => {
  const { mutateAsync: updateTrack } = useUpdateTrack({
    shotIdOverride: containerShotId
  });

  const handleSave = (newName: string) => {
    void updateTrack({
      layerId: track.id,
      layerName: newName,
      layerData: track.data
    });
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <InlineEditableText
        value={track.name}
        onSave={handleSave}
        maxLength={MAX_TRACK_NAME_LENGTH}
        trigger="click"
        stopPropagation
        className="min-w-0 flex-1"
      >
        <Text
          component="span"
          variant="sm"
          color="glyph-primary"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {track.name}
        </Text>
      </InlineEditableText>
      <span className="flex shrink-0 items-center gap-1.5">
        <Text
          component="span"
          variant="xs"
          color={status ? getStatusColor(status) : "glyph-tertiary"}
        >
          {statusText}
        </Text>
      </span>
    </div>
  );
};
