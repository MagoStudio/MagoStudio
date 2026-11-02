import { GhostButton } from "@components/GhostButton";
import { useClipboardMessage } from "@hooks/useClipboardMessage";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { CopyPasteButtonGroup } from "../../CopyPasteButtonGroup";

import { Img2ImgSchema, Img2ImgType } from "./schemas";

export const CopyPasteReset: React.FC = () => {
  const { t } = useTranslation();
  const { getValues, reset } = useFormContext<Img2ImgType>();
  const [settingsCopy, setSettingsCopy] = useState<Img2ImgType | null>(null);

  const {
    message: copyMessage,
    showMessage: showCopyMessage,
    resetMessage: resetCopyMessage
  } = useClipboardMessage();
  const {
    message: pasteMessage,
    showMessage: showPasteMessage,
    resetMessage: resetPasteMessage
  } = useClipboardMessage();

  const handleCopySettings = async () => {
    const settings = getValues();
    try {
      setSettingsCopy(settings);

      const settingsToCopy = { ...settings };
      delete settingsToCopy.uploadedImageId;
      delete settingsToCopy.iteratedAssetId;
      delete settingsToCopy.iteratedSourceFrame;

      const settingsString = JSON.stringify(settingsToCopy, null, 2);
      await navigator.clipboard.writeText(settingsString);

      showCopyMessage(
        t("notifications.settings_copied_to_clipboard.description"),
        "success"
      );
    } catch (err) {
      showCopyMessage(
        t("notifications.failed_to_copy_settings.description"),
        "error"
      );
    }
  };

  const handlePasteSettings = async () => {
    try {
      const settingsString = await navigator.clipboard.readText();
      const parsedSettings = JSON.parse(settingsString);

      const validatedSettings = Img2ImgSchema.parse(parsedSettings);

      reset({ ...settingsCopy, ...validatedSettings });

      showPasteMessage(
        t("notifications.settings_pasted_successfully.description"),
        "success"
      );
    } catch (err: any) {
      console.error("Failed to paste settings:", err);
      showPasteMessage(
        t("notifications.failed_to_paste_settings.description"),
        "error"
      );
    }
  };

  const handleResetToDefault = () => {
    const { model } = getValues();
    const defaultValues = Img2ImgSchema.parse({ model });
    reset(defaultValues);
  };

  return (
    <div className="flex gap-1 justify-end">
      <GhostButton onPress={handleResetToDefault} type="button">
        {t("actions.reset_settings.label")}
      </GhostButton>
      <CopyPasteButtonGroup
        handleCopySettings={handleCopySettings}
        handlePasteSettings={handlePasteSettings}
        copyMessage={copyMessage}
        pasteMessage={pasteMessage}
        resetCopyMessage={resetCopyMessage}
        resetPasteMessage={resetPasteMessage}
      />
    </div>
  );
};
