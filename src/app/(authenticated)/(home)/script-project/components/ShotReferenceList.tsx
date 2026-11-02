import { SheetImageUrls } from "@domains/scriptProject/utils/buildSheetImageUrlIndex";
import { ShotReferenceChip } from "@domains/scriptProject/utils/buildShotReferenceChips";

import { ShotReferenceCard } from "./ShotReferenceCard";

type Props = {
  chips: ShotReferenceChip[];
  imageUrlsByAssetId: Map<string, SheetImageUrls>;
  isBusy: boolean;
  onRemoveReference: (chip: ShotReferenceChip) => void;
};

export const ShotReferenceList: React.FC<Props> = ({
  chips,
  imageUrlsByAssetId,
  isBusy,
  onRemoveReference
}) => {
  return chips.map((chip) => (
    <ShotReferenceCard
      key={`${chip.category}-${chip.token}`}
      chip={chip}
      imageUrls={
        chip.assetId ? imageUrlsByAssetId.get(chip.assetId) : undefined
      }
      isBusy={isBusy}
      onRemove={() => onRemoveReference(chip)}
    />
  ));
};
