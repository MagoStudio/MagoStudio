import { Badge } from "@components/Badge";
import { InlineEditableText } from "@components/InlineEditableText";
import { MAX_TRACK_NAME_LENGTH } from "@constants";
import { useUpdateTrack } from "@domains/track/useUpdateTrack";
import { Layer } from "@schemas/layer";

interface EditableTrackNameProps {
  track: Layer;
  setRenamingTrackId: (id: Layer["id"] | null) => void;
}

export const EditableTrackName: React.FC<EditableTrackNameProps> = ({
  track,
  setRenamingTrackId
}) => {
  const { mutateAsync: updateTrack } = useUpdateTrack();

  const handleSave = (newName: string) => {
    void updateTrack({
      layerId: track.id,
      layerName: newName,
      layerData: track.data
    });
  };

  const handleEditingChange = (isEditing: boolean) => {
    setRenamingTrackId(isEditing ? track.id : null);
  };

  return (
    <InlineEditableText
      value={track.name}
      onSave={handleSave}
      maxLength={MAX_TRACK_NAME_LENGTH}
      inputClassName="text-sm pl-[5px]"
      trigger="click"
      onEditingChange={handleEditingChange}
      stopPropagation
      className="shrink cursor-pointer pointer-events-auto"
    >
      <Badge className="shrink cursor-pointer pointer-events-auto">
        {track.name}
      </Badge>
    </InlineEditableText>
  );
};
