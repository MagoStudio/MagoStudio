import { Input } from "@components/Input";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type {
  LocalModelDefinition,
  ModelPreferences,
  ModelSettingsSnapshot
} from "../../../../../../../desktop/shared/modelSettings";

import { ModelOperationDetailsButton } from "./ModelOperationDetailsButton";
import { ModelOperationStatus } from "./ModelOperationStatus";
import { ModelSettingsField } from "./ModelSettingsField";
import type { ModelSettingsOperation } from "./modelSettingsOperation";
import { ModelSettingsSelect } from "./ModelSettingsSelect";

const CONTEXT_OPTIONS = Object.values({
  small: 4096,
  medium: 8192,
  large: 16384,
  standard: 32768,
  extended: 65536
});
const BATCH_OPTIONS = Object.values({
  small: 128,
  medium: 256,
  standard: 512,
  large: 1024
});
const DEFAULT_CONTEXT = 32768;
type Props = {
  definition: LocalModelDefinition;
  snapshot: ModelSettingsSnapshot;
  preferences: ModelPreferences;
  memoryPolicy: "auto" | "low-vram";
  busy: boolean;
  operation: ModelSettingsOperation | null;
  onChange: (value: ModelPreferences) => void;
  onMemoryPolicy: (value: "auto" | "low-vram") => void;
  onSave: () => void;
  onCheck: () => void;
  onRepair: () => void;
  onLoad: () => void;
};
export const ModelLoadEditor = ({
  definition,
  snapshot,
  preferences,
  memoryPolicy,
  busy,
  operation,
  onChange,
  onMemoryPolicy,
  onSave,
  onCheck,
  onRepair,
  onLoad
}: Props) => {
  const { t } = useTranslation();
  const text = preferences.text;
  const canProbe = snapshot.available && !!snapshot.python;
  return (
    <div className="flex flex-col gap-3">
      {definition.runtime === "llama" ? (
        <>
          <ModelSettingsField label={t("modelSettings.loadMode")}>
            <ModelSettingsSelect
              aria-label={t("modelSettings.loadMode")}
              value={text.mode}
              disabled={busy}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  text: {
                    ...text,
                    mode: event.target.value as typeof text.mode
                  }
                })
              }
            >
              {(["auto", "custom", "all", "cpu"] as const).map((mode) => (
                <option key={mode} value={mode}>
                  {t(`modelSettings.modes.${mode}`)}
                </option>
              ))}
            </ModelSettingsSelect>
          </ModelSettingsField>
          {text.mode === "custom" && (
            <ModelSettingsField label={t("modelSettings.gpuLayers")}>
              <Input
                type="number"
                aria-label={t("modelSettings.gpuLayers")}
                min={0}
                max={1000}
                disabled={busy}
                value={text.gpuLayers}
                onChange={(event) =>
                  onChange({
                    ...preferences,
                    text: { ...text, gpuLayers: Number(event.target.value) }
                  })
                }
              />
            </ModelSettingsField>
          )}
          <div className="grid grid-cols-2 gap-3">
            <ModelSettingsField label={t("modelSettings.context")}>
              <ModelSettingsSelect
                aria-label={t("modelSettings.context")}
                value={text.context}
                disabled={busy}
                onChange={(event) =>
                  onChange({
                    ...preferences,
                    text: { ...text, context: Number(event.target.value) }
                  })
                }
              >
                {CONTEXT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value.toLocaleString()}
                  </option>
                ))}
              </ModelSettingsSelect>
            </ModelSettingsField>
            <ModelSettingsField label={t("modelSettings.batch")}>
              <ModelSettingsSelect
                aria-label={t("modelSettings.batch")}
                value={text.batch}
                disabled={busy}
                onChange={(event) =>
                  onChange({
                    ...preferences,
                    text: { ...text, batch: Number(event.target.value) }
                  })
                }
              >
                {BATCH_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </ModelSettingsSelect>
            </ModelSettingsField>
          </div>
          {text.context < DEFAULT_CONTEXT && (
            <Text variant="xs" color="glyph-warning">
              {t("modelSettings.contextWarning")}
            </Text>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={text.offloadCache && text.mode !== "cpu"}
              disabled={busy || text.mode === "cpu"}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  text: { ...text, offloadCache: event.target.checked }
                })
              }
            />
            <Text component="span" variant="xs" color="glyph-secondary">
              {t("modelSettings.cacheOffload")}
            </Text>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={text.memoryMap}
              disabled={busy}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  text: { ...text, memoryMap: event.target.checked }
                })
              }
            />
            <Text component="span" variant="xs" color="glyph-secondary">
              {t("modelSettings.memoryMap")}
            </Text>
          </label>
          <Text variant="2xs" color="glyph-tertiary">
            {t("modelSettings.textRuntimeHint")}
          </Text>
        </>
      ) : (
        <>
          <ModelSettingsField
            label={t("modelSettings.memoryPolicy")}
            hint={t("modelSettings.serverPolicyHint")}
          >
            <ModelSettingsSelect
              aria-label={t("modelSettings.memoryPolicy")}
              value={memoryPolicy}
              disabled={busy || !snapshot.managed}
              onChange={(event) =>
                onMemoryPolicy(event.target.value as typeof memoryPolicy)
              }
            >
              <option value="auto">{t("modelSettings.automatic")}</option>
              <option value="low-vram">{t("modelSettings.lowVram")}</option>
            </ModelSettingsSelect>
          </ModelSettingsField>
          {memoryPolicy === "low-vram" && (
            <Text variant="xs" color="glyph-warning">
              {t("modelSettings.restartRequired")}
            </Text>
          )}
          <ModelSettingsField label={t("modelSettings.encoderDevice")}>
            <ModelSettingsSelect
              aria-label={t("modelSettings.encoderDevice")}
              value={preferences.encoderDevice}
              disabled={busy}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  encoderDevice: event.target
                    .value as typeof preferences.encoderDevice
                })
              }
            >
              <option value="default">
                {t("modelSettings.workflowDefault")}
              </option>
              <option value="cpu" disabled={!snapshot.capabilities.encoderCpu}>
                {t("modelSettings.modes.cpu")}
              </option>
            </ModelSettingsSelect>
          </ModelSettingsField>
          {definition.supportsTiledDecode && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.tiledDecode}
                disabled={busy || !snapshot.capabilities.tiledDecode}
                onChange={(event) =>
                  onChange({
                    ...preferences,
                    tiledDecode: event.target.checked
                  })
                }
              />
              <Text component="span" variant="xs" color="glyph-secondary">
                {t("modelSettings.tiledDecode")}
              </Text>
            </label>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <MainButton
          size="sm"
          colorScheme="secondary"
          isDisabled={busy || !canProbe}
          onPress={onLoad}
        >
          {t("modelSettings.testLoad")}
        </MainButton>
        <MainButton size="sm" isDisabled={busy} onPress={onSave}>
          {t("modelSettings.saveLoad")}
        </MainButton>
        <MainButton
          size="sm"
          colorScheme="secondary"
          isDisabled={busy || !canProbe}
          onPress={onCheck}
        >
          {t("modelSettings.checkInstallation")}
        </MainButton>
        <MainButton
          size="sm"
          colorScheme="secondary"
          isDisabled={busy || !canProbe}
          onPress={onRepair}
        >
          {t("modelSettings.repairRuntime")}
        </MainButton>
      </div>
      <div className="flex items-start gap-2">
        <ModelOperationStatus
          operation={operation}
          slots={["testLoad", "saveLoad", "runtime", "repair"]}
        />
        <ModelOperationDetailsButton
          operation={operation}
          slots={["testLoad", "saveLoad", "runtime", "repair"]}
        />
      </div>
      <Text variant="2xs" color="glyph-tertiary">
        {t(
          snapshot.python
            ? "modelSettings.probeHint"
            : "modelSettings.remoteProbeHint"
        )}
      </Text>
    </div>
  );
};
