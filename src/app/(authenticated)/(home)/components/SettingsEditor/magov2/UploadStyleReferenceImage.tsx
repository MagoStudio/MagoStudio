import { CircularProgress } from "@components/CircularProgress";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { Text } from "@components/Text";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { useUpdateTrack } from "@domains/track/useUpdateTrack";
import { truncateFileNameFixed } from "@home/components/fileUpload/helpers/truncateFileName";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { cn } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";

const DEFAULT_MAX_FILENAME_LENGTH = 6;
interface Props {
  isDisabled?: boolean;
  styleReferenceImageId?: string;
  hasCropMismatchError?: boolean;
}

export const UploadStyleReferenceImage = ({
  isDisabled,
  styleReferenceImageId,
  hasCropMismatchError = false
}: Props) => {
  const { sourcesAtom } = useRenderSettingsAtoms();
  const sources = useAtomValue(sourcesAtom);
  const setSources = useSetAtom(sourcesAtom);
  const { isPending: isTrackUpdating } = useUpdateTrack();

  const { data: imageAssetData } = useImageAsset({
    assetId: styleReferenceImageId
  });

  const onDeleteReferenceImage = () => {
    setSources(
      sources.filter((entry) => entry.asset_id !== styleReferenceImageId)
    );
  };

  if (!imageAssetData || !styleReferenceImageId || !imageAssetData.urlToUse) {
    return null;
  }

  return (
    <div className={"flex flex-col gap-1.5 items-start"}>
      <ImageThumbnail
        src={imageAssetData.urlToUse}
        name={imageAssetData.asset?.name}
        onDelete={onDeleteReferenceImage}
        classNames={{
          root: cn(
            "w-[154px] h-[84px]",
            hasCropMismatchError && "border-2 border-element-error"
          )
        }}
      />
      {isTrackUpdating ? (
        <CircularProgress disabled={isDisabled} size="sm" />
      ) : (
        <Text
          className="break-all"
          color="glyph-tertiary"
          disabled={isDisabled}
          select="none"
          variant="xs"
        >
          {truncateFileNameFixed(
            imageAssetData.asset.name || "",
            DEFAULT_MAX_FILENAME_LENGTH,
            0
          )}
        </Text>
      )}
    </div>
  );
};
