import { VersionReferenceImage } from "./VersionReferenceImage";

type Props = {
  assetIds: string[];
};

export const VersionReferenceImages: React.FC<Props> = ({ assetIds }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {assetIds.map((assetId) => (
        <VersionReferenceImage key={assetId} assetId={assetId} />
      ))}
    </div>
  );
};
