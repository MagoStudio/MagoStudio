import { SheetGroup, ShotState } from "@schemas/scriptProject";

import { readOutputSize } from "./readOutputSize";

export const resolveShotReferenceImageSizes = ({
  shot,
  sheetGroups,
  outputSize,
  isContinuationSent
}: {
  shot: ShotState;
  sheetGroups: SheetGroup[];
  outputSize: [number, number];
  isContinuationSent: boolean;
}): ([number, number] | null)[] => {
  const sheetImageSizeByAssetId = new Map(
    sheetGroups.flatMap((group) =>
      group.images.map(
        (image) =>
          [
            image.asset_id,
            readOutputSize({ output_size: image.size }) ??
              readOutputSize(image.render_spec)
          ] as const
      )
    )
  );
  const taggedReferenceSizes = Object.values(shot.references)
    .flat()
    .map(
      (reference) => sheetImageSizeByAssetId.get(reference.asset_id) ?? null
    );
  return isContinuationSent
    ? [...taggedReferenceSizes, outputSize]
    : taggedReferenceSizes;
};
