import { SheetImageUrls } from "@domains/scriptProject/utils/buildSheetImageUrlIndex";
import { ShotReferenceChip } from "@domains/scriptProject/utils/buildShotReferenceChips";

import { ShotReferenceCard } from "./ShotReferenceCard";

type Props = {
  chips: ShotReferenceChip[];
  imageUrlsByAssetId: Map<string, SheetImageUrls>;
  isBusy: boolean;
  voicedCharacterTokens: ReadonlySet<string>;
  onRemoveReference: (chip: ShotReferenceChip) => void;
};

export const ShotReferenceList: React.FC<Props> = ({
  chips,
  imageUrlsByAssetId,
  isBusy,
  voicedCharacterTokens,
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
      hasVoice={
        chip.category === "characters" && voicedCharacterTokens.has(chip.token)
      }
      onRemove={() => onRemoveReference(chip)}
    />
  ));
};
