import { FieldFileDropZone } from "@components/Form/Fields/FieldFileDropZone";
import { FieldPromptWithEnhance } from "@components/Form/Fields/FieldPromptWithEnhance";
import React from "react";
import { useTranslation } from "react-i18next";

import { Seedream5ProPromptTip } from "./Seedream5ProPromptTip";

export const Seedream5ProForm: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <Seedream5ProPromptTip />
      <FieldPromptWithEnhance
        name="prompt"
        label={t("img2imgForms.common.prompt.label")}
        tooltip={t("img2imgForms.seedream_5_pro.prompt.tooltip")}
      />
      <FieldFileDropZone
        name="referenceImages"
        text={t("img2imgForms.common.image_style_reference.upload_text")}
        label={t("img2imgForms.common.image_style_reference.label")}
        tooltip={t("img2imgForms.common.image_style_reference.tooltip")}
        maxFileUpload={9}
      />
    </div>
  );
};
