import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { NormalizedCropRect } from "@domains/renders/utils/cropRect";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useUser } from "@platform/identity";
import { useAtom, useSetAtom } from "jotai";
import { createJSONStorage } from "jotai/utils";

import { buildPrefixedStorageKey } from "./utils/buildPrefixedStorageKey";
import { createScopedStorageAtomCache } from "./utils/createScopedStorageAtomCache";
import { hasCompleteCropIdentifiers } from "./utils/hasCompleteCropIdentifiers";
import { isCropToolActive } from "./utils/isCropToolActive";
import { parseCropStorage } from "./utils/parseCropStorage";

const CROP_STORAGE_KEY_PREFIX = "shot-crop";

export interface CropStorage {
  crop: NormalizedCropRect | undefined;
}

const DEFAULT_CROP_STORAGE: CropStorage = { crop: undefined };

const jsonStorage = createJSONStorage<CropStorage>(() => localStorage);
const validatingStorage: typeof jsonStorage = {
  ...jsonStorage,
  getItem: (key, initialValue) =>
    parseCropStorage(
      jsonStorage.getItem(key, initialValue),
      DEFAULT_CROP_STORAGE
    )
};

const getScopedCropStorageAtom = createScopedStorageAtomCache<CropStorage>({
  defaultValue: DEFAULT_CROP_STORAGE,
  storage: validatingStorage,
  options: { getOnInit: true }
});

export function getCropStorageAtom(
  userId: string | undefined,
  projectId: string | undefined,
  shotId: string | undefined
) {
  return getScopedCropStorageAtom(
    buildPrefixedStorageKey(CROP_STORAGE_KEY_PREFIX, {
      level: "shot",
      userId,
      projectId,
      shotId
    })
  );
}

export interface ShotCrop {
  crop: NormalizedCropRect | undefined;
  isCropToolActive: boolean;
  setCrop: (crop: NormalizedCropRect) => void;
  clearCrop: () => void;
}

export function useShotCrop(): ShotCrop {
  const projectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const { user } = useUser();
  const userId = user?.id || "";
  const effectiveProjectId = projectId || "";
  const effectiveShotId = selectedShotId || "";

  const storageAtom = getCropStorageAtom(
    userId,
    effectiveProjectId,
    effectiveShotId
  );
  const [storage, setStorage] = useAtom(storageAtom);

  if (
    !hasCompleteCropIdentifiers({
      userId,
      projectId: effectiveProjectId,
      shotId: effectiveShotId
    })
  ) {
    return {
      crop: undefined,
      isCropToolActive: false,
      setCrop: () => {},
      clearCrop: () => {}
    };
  }

  return {
    crop: storage.crop,
    isCropToolActive: isCropToolActive(storage.crop),
    setCrop: (crop: NormalizedCropRect) => setStorage({ crop }),
    clearCrop: () => setStorage({ crop: undefined })
  };
}

export function useClearCrop(): () => void {
  const projectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const { user } = useUser();
  const userId = user?.id || "";
  const effectiveProjectId = projectId || "";
  const effectiveShotId = selectedShotId || "";

  const storageAtom = getCropStorageAtom(
    userId,
    effectiveProjectId,
    effectiveShotId
  );
  const setStorage = useSetAtom(storageAtom);

  if (
    !hasCompleteCropIdentifiers({
      userId,
      projectId: effectiveProjectId,
      shotId: effectiveShotId
    })
  ) {
    return () => {};
  }

  return () => setStorage({ crop: undefined });
}
