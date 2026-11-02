import { FieldFileDropZone } from "@components/Form/Fields/FieldFileDropZone";
import { FieldPromptWithEnhance } from "@components/Form/Fields/FieldPromptWithEnhance";
import { FieldSelect } from "@components/Form/Fields/FieldSelect";
import React from "react";
import { useTranslation } from "react-i18next";

import { NANOBANANA_2_RESOLUTIONS } from "../schemas/nanobanana2.schema";

const RESOLUTION_OPTIONS = NANOBANANA_2_RESOLUTIONS.map((res) => ({
  label: res,
  key: res
}));

export const Nanobanana2Form: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <FieldPromptWithEnhance
        name="prompt"
        label={t("img2imgForms.common.prompt.label")}
        tooltip={t("img2imgForms.nanobanana_2.prompt.tooltip")}
      />
      <FieldSelect
        name="resolution"
        items={RESOLUTION_OPTIONS}
        label={t("img2imgForms.nanobanana_2.resolution.label")}
        tooltip={t("img2imgForms.nanobanana_2.resolution.tooltip")}
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
