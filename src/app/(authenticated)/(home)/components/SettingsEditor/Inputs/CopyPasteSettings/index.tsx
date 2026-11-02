import { SourceImage } from "@domains/renders/types";
import { FIRSTFRAME_MODEL_MIN_STEPS } from "@hooks/renders/data/magov2/data";
import { getToolForEngine } from "@hooks/tool/getToolForEngine";
import { useTool } from "@hooks/tool/useTool";
import { useClipboardMessage } from "@hooks/useClipboardMessage";
import { useCopiedRenderSettings } from "@hooks/userLocalStorage/useCopiedRenderSettings";
import { RENDER_MODELS } from "@models/video/constants";
import { generateVideoValidationSchema } from "@models/video/generateVideoValidationSchema";
import { VideoEngine, VideoSettings } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { SOURCE_MIRRORED_SETTING_KEYS } from "@store/utils/enrichVideoSettingsFromSources";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { CopyPasteButtonGroup } from "../../../CopyPasteButtonGroup";

import { buildCopyPayload } from "./buildCopyPayload";
import { normalizeValue } from "./normalizeValue";

const ENGINE_SWITCH_DELAY_MS = 100;

type PastedPayload = Partial<VideoSettings> & {
  presetId?: string;
  sources?: SourceImage[];
};

export const CopyPasteSettings: React.FC = () => {
  const { t } = useTranslation();

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

  const {
    renderSettingsValuesAtom,
    selectedModelAtom,
    loadSettingsAtom,
    selectedPresetAtom,
    sourcesAtom
  } = useRenderSettingsAtoms();
  const [renderSettings, setRenderSettings] = useAtom(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const onLoadSettings = useSetAtom(loadSettingsAtom);
  const selectedPresetState = useAtomValue(selectedPresetAtom);
  const sources = useAtomValue(sourcesAtom);
  const { tool, setTool } = useTool();

  const { copiedRenderSettings, setCopiedRenderSettings } =
    useCopiedRenderSettings();

  const handleCopySettings = async () => {
    if (!renderSettings) return;

    const settingsToCopy = buildCopyPayload(
      selectedModel,
      renderSettings,
      selectedPresetState?.presetId,
      sources
    );

    try {
      setCopiedRenderSettings(settingsToCopy as any);

      const settingsString = JSON.stringify(settingsToCopy, null, 2);
      await navigator.clipboard.writeText(settingsString);

      showCopyMessage(
        t("notifications.copied_to_clipboard.description"),
        "success"
      );
    } catch (error) {
      console.error("Failed to copy settings:", error);
      showCopyMessage(
        t("notifications.failed_to_copy_settings.description"),
        "error"
      );
    }
  };

  const handlePasteSettings = async () => {
    try {
      let clipboardText = "";
      try {
        clipboardText = await navigator.clipboard.readText();
      } catch {}

      let parsedData: PastedPayload | undefined;

      if (clipboardText) {
        parsedData = JSON.parse(clipboardText) as PastedPayload;
      } else if (copiedRenderSettings) {
        parsedData = copiedRenderSettings as PastedPayload;
      }

      if (!parsedData || typeof parsedData !== "object") {
        showPasteMessage(
          t("notifications.clipboard_is_empty.description"),
          "error"
        );
        return;
      }

      const { presetId, sources: pastedSources = [], ...settings } = parsedData;

      const targetEngine = settings.mago_engine;
      if (!targetEngine || typeof targetEngine !== "string") {
        throw new Error("No model specified in pasted settings");
      }

      const targetModel = RENDER_MODELS.find(
        (model) => model.name === targetEngine
      );

      if (!targetModel) {
        throw new Error(`Unknown model: ${targetEngine}`);
      }

      const validationResult = generateVideoValidationSchema(
        targetModel,
        pastedSources
      ).safeParse(settings);
      if (!validationResult.success) {
        const invalidPaths = validationResult.error.issues
          .map((issue) => issue.path[0] as string)
          .filter(Boolean);

        invalidPaths.forEach((path: string) => {
          delete settings[path];
        });

        console.log("Removed invalid keys:", invalidPaths);
      }

      const allSettings = flattenSettingsGroups(targetModel).flatMap(
        (section) => section.settings
      );
      const validKeys = allSettings.flatMap((setting) =>
        setting.secondKey ? [setting.key, setting.secondKey] : [setting.key]
      );

      const updated = { ...renderSettings };
      SOURCE_MIRRORED_SETTING_KEYS.forEach((key) => {
        delete updated[key];
      });
      Object.keys(settings).forEach((key) => {
        if (validKeys.includes(key)) {
          (updated as any)[key] = normalizeValue(settings[key], key);
        }
      });

      const isEngineSwitchRequired = selectedModel.name !== targetEngine;
      const targetTool = getToolForEngine(targetEngine as VideoEngine);
      const isToolSwitchRequired = targetTool !== tool;

      const buildEngineSwitchValues = () => {
        const isWanModel = targetModel.isWanModel === true;
        const finalSteps =
          isWanModel &&
          typeof settings.steps === "number" &&
          settings.steps < FIRSTFRAME_MODEL_MIN_STEPS
            ? FIRSTFRAME_MODEL_MIN_STEPS
            : settings.steps;
        return {
          ...updated,
          steps: finalSteps,
          mago_engine: targetEngine
        } as VideoSettings;
      };

      if (isToolSwitchRequired) {
        const valueSettings = isEngineSwitchRequired
          ? buildEngineSwitchValues()
          : (updated as VideoSettings);
        setTool(targetTool);
        onLoadSettings({
          values: valueSettings,
          sources: pastedSources,
          presetId,
          targetTool
        });
        showPasteMessage(t("notifications.pasted.description"), "success");
      } else if (isEngineSwitchRequired) {
        const engineUpdate = { mago_engine: targetEngine };
        setRenderSettings(engineUpdate);

        setTimeout(() => {
          const valueSettings = buildEngineSwitchValues();
          setRenderSettings(valueSettings);
          onLoadSettings({
            values: valueSettings,
            sources: pastedSources,
            presetId,
            targetTool
          });
          showPasteMessage(t("notifications.pasted.description"), "success");
        }, ENGINE_SWITCH_DELAY_MS);
      } else {
        setRenderSettings(updated);
        onLoadSettings({
          values: updated as VideoSettings,
          sources: pastedSources,
          presetId,
          targetTool
        });
        showPasteMessage(t("notifications.pasted.description"), "success");
      }
    } catch (error) {
      console.error("Failed to paste settings:", error);
      showPasteMessage(
        t("notifications.failed_to_paste_settings.description"),
        "error"
      );
    }
  };

  return (
    <CopyPasteButtonGroup
      handleCopySettings={handleCopySettings}
      copyMessage={copyMessage}
      resetCopyMessage={resetCopyMessage}
      handlePasteSettings={handlePasteSettings}
      pasteMessage={pasteMessage}
      resetPasteMessage={resetPasteMessage}
    />
  );
};
