import { findMissingReferenceCloudAssetId } from "./findMissingReferenceCloudAssetId";

export interface MirroredAdaptPromptReference {
  localAssetId: string;
  cloudAssetId: string;
}

export const adaptWithStaleCloudReferencesReplaced = async <TAdapted>({
  mirrorReferences,
  adapt,
  markReferenceStale
}: {
  mirrorReferences: () => Promise<MirroredAdaptPromptReference[]>;
  adapt: (cloudAssetIds: string[]) => Promise<TAdapted>;
  markReferenceStale: (localAssetId: string) => Promise<void>;
}): Promise<TAdapted> => {
  const replacedLocalAssetIds = new Set<string>();
  for (;;) {
    const references = await mirrorReferences();
    try {
      return await adapt(references.map((reference) => reference.cloudAssetId));
    } catch (error) {
      const missingCloudAssetId = findMissingReferenceCloudAssetId(error);
      const staleReference = references.find(
        (reference) => reference.cloudAssetId === missingCloudAssetId
      );
      const canReplaceStaleReference =
        !!staleReference &&
        !replacedLocalAssetIds.has(staleReference.localAssetId);
      if (!canReplaceStaleReference) throw error;
      replacedLocalAssetIds.add(staleReference.localAssetId);
      await markReferenceStale(staleReference.localAssetId);
    }
  }
};
