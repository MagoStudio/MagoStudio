import { useMountEffect } from "@hooks/useMountEffect";
import { getImg2ImgStorageAtom } from "@store/img2imgSettingsStore";
import { sanitizeImg2ImgForStorage } from "@store/utils/sanitizeImg2ImgForStorage";
import { useSetAtom } from "jotai";
import { useFormContext } from "react-hook-form";

import { Img2ImgType } from "./schemas";

type Img2ImgFormPersistenceProps = {
  settingsAtom: ReturnType<typeof getImg2ImgStorageAtom>;
};

export const Img2ImgFormPersistence: React.FC<Img2ImgFormPersistenceProps> = ({
  settingsAtom
}) => {
  const { watch } = useFormContext<Img2ImgType>();
  const setSettings = useSetAtom(settingsAtom);

  useMountEffect(() => {
    const subscription = watch((values) => {
      setSettings(sanitizeImg2ImgForStorage(values as Img2ImgType));
    });
    return () => subscription.unsubscribe();
  });

  return null;
};
