import { useUser } from "@clerk/react";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import {
  Img2ImgSchema,
  Img2ImgType
} from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { createJSONStorage } from "jotai/utils";

import { buildPrefixedStorageKey } from "./utils/buildPrefixedStorageKey";
import { createScopedStorageAtomCache } from "./utils/createScopedStorageAtomCache";
import { UNRESOLVED_SCOPE_KEY_PREFIX } from "./utils/storageScope";

const IMG2IMG_SETTINGS_KEY_PREFIX = "img2img-settings";

const createDefaultImg2ImgValues = (): Img2ImgType =>
  Img2ImgSchema.parse({ model: "gpt_image_2" });

const jsonStorage = createJSONStorage<Img2ImgType>(() => localStorage);
const validatingStorage: typeof jsonStorage = {
  ...jsonStorage,
  getItem: (key, initialValue) => {
    const value = jsonStorage.getItem(key, initialValue);
    const parsed = Img2ImgSchema.safeParse(value);
    return parsed.success ? parsed.data : createDefaultImg2ImgValues();
  }
};

export const getImg2ImgStorageAtom = createScopedStorageAtomCache<Img2ImgType>({
  defaultValue: createDefaultImg2ImgValues(),
  storage: validatingStorage,
  options: { getOnInit: true }
});

export function useImg2ImgSettingsAtom() {
  const projectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const { user } = useUser();

  const storageKey = buildPrefixedStorageKey(IMG2IMG_SETTINGS_KEY_PREFIX, {
    level: "shot",
    userId: user?.id,
    projectId,
    shotId: selectedShotId
  });

  return {
    atom: getImg2ImgStorageAtom(storageKey),
    storageKey:
      storageKey ??
      `${UNRESOLVED_SCOPE_KEY_PREFIX}${IMG2IMG_SETTINGS_KEY_PREFIX}`
  };
}
