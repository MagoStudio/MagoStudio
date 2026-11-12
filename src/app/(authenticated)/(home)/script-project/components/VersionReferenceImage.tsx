import { Text } from "@components/Text";
import { useImageAsset } from "@domains/asset/useImageAsset";

type Props = {
  assetId: string;
};

export const VersionReferenceImage: React.FC<Props> = ({ assetId }) => {
  const { data: image } = useImageAsset({ assetId });
  const name = image?.asset.name ?? assetId;

  return (
    <div
      className="flex w-14 flex-col gap-0.5"
      data-testid={`version-reference-${assetId}`}
    >
      <div className="aspect-square w-full overflow-hidden rounded bg-element-primary">
        {image?.urlToUse && (
          <img
            src={image.urlToUse}
            alt={name}
            className="size-full object-cover"
          />
        )}
      </div>
      <Text variant="2xs" color="glyph-tertiary" className="truncate">
        {name}
      </Text>
    </div>
  );
};
