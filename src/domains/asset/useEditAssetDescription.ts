import { useToast } from "@store/useToast";
import { useTranslation } from "react-i18next";

import { useEditAssetDescription as useEditAssetDescriptionMutation } from "./data/useEditAssetDescription";

export const useEditAssetDescription = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  return useEditAssetDescriptionMutation({
    onError: () =>
      showToast({
        message: t("script_project.edit_description_failed.description")
      })
  });
};
