import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type {
  LocalModelDefinition,
  ModelComponent,
  ModelPreferences,
  ModelSettingsSnapshot
} from "../../../../../../../desktop/shared/modelSettings";

import { ModelComponentSelect } from "./ModelComponentSelect";
import { ModelFileDetailsPanel } from "./ModelFileDetailsPanel";
import { ModelFileLastCheck } from "./ModelFileLastCheck";
import { ModelFileSelect } from "./ModelFileSelect";
import { ModelOperationStatus } from "./ModelOperationStatus";
import { ModelSettingsField } from "./ModelSettingsField";
import { ModelSettingsInfoButton } from "./ModelSettingsInfoButton";
import type { ModelSettingsOperation } from "./modelSettingsOperation";
import { ModelSettingsSelect } from "./ModelSettingsSelect";
import { RecommendedModelFileDownload } from "./RecommendedModelFileDownload";

type Props = {
  definition: LocalModelDefinition;
  snapshot: ModelSettingsSnapshot;
  preferences: ModelPreferences;
  role: ModelComponent;
  candidate: string;
  isCandidateInstalled: boolean;
  busy: boolean;
  operation: ModelSettingsOperation | null;
  onVariant: (value: string) => void;
  onRole: (role: ModelComponent) => void;
  onCandidate: (file: string) => void;
  onLoad: () => void;
  onHash: () => void;
  onRecommendedFileDownloaded: () => void;
};
export const ModelFilesEditor = ({
  definition,
  snapshot,
  preferences,
  role,
  candidate,
  isCandidateInstalled,
  busy,
  operation,
  onVariant,
  onRole,
  onCandidate,
  onLoad,
  onHash,
  onRecommendedFileDownloaded
}: Props) => {
  const { t } = useTranslation();
  const component =
    snapshot.components.find((component) => component.role === role) ??
    snapshot.components[0];
  const isRecommendedFileSelectedButMissing =
    candidate === component.recommendedFile.filename &&
    !component.recommendedFile.isInstalled;
  return (
    <div className="flex flex-col gap-3">
      <ModelSettingsField
        label={t("modelSettings.variant")}
        hint={
          preferences.variant === "auto"
            ? t("modelSettings.automaticHint", {
                variant:
                  definition.variants.find(
                    (variant) => variant.id === snapshot.setupTextVariant
                  )?.label ?? snapshot.setupTextVariant
              })
            : t("modelSettings.manualHint")
        }
      >
        <ModelSettingsSelect
          aria-label={t("modelSettings.variant")}
          value={preferences.variant}
          disabled={busy}
          onChange={(event) => onVariant(event.target.value)}
        >
          {definition.defaultVariant === "auto" && (
            <option value="auto">{t("modelSettings.automatic")}</option>
          )}
          {definition.defaultVariant === "default" && (
            <option value="default">
              {t("modelSettings.workflowDefault")}
            </option>
          )}
          {definition.variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.label}
            </option>
          ))}
        </ModelSettingsSelect>
      </ModelSettingsField>
      <ModelOperationStatus operation={operation} slots={["variant"]} />
      <ModelSettingsField label={t("modelSettings.component")}>
        <ModelComponentSelect
          value={component.role}
          disabled={busy}
          components={snapshot.components}
          onChange={onRole}
        />
      </ModelSettingsField>
      <Text variant="2xs" color="glyph-tertiary" className="break-all">
        {t("modelSettings.currentFile", { file: component.selectedFile })}
      </Text>
      <ModelSettingsField label={t("modelSettings.file")}>
        <ModelFileSelect
          value={candidate}
          disabled={busy || !snapshot.available}
          recommendedFile={component.recommendedFile}
          choices={component.choices}
          onChange={onCandidate}
        />
      </ModelSettingsField>
      {isRecommendedFileSelectedButMissing && (
        <RecommendedModelFileDownload
          recommendedFile={component.recommendedFile}
          onModelSaved={onRecommendedFileDownloaded}
        />
      )}
      <ModelOperationStatus
        operation={operation}
        slots={["useFile", "restore"]}
      />
      <div className="flex items-center gap-1">
        <ModelFileLastCheck
          latestFileCheck={
            component.choices.find((choice) => choice.filename === candidate)
              ?.latestFileCheck ?? null
          }
        />
        <ModelSettingsInfoButton
          ariaLabel={t("modelSettings.fileDetailsButton")}
          testId="model-file-details-button"
        >
          <ModelFileDetailsPanel
            pickedFile={
              component.choices.find(
                (choice) => choice.filename === candidate
              ) ?? {
                path: null,
                sourceUrl: component.recommendedFile.sourceUrl,
                expectedSha256: null,
                actualSha256: null
              }
            }
            operation={operation}
            busy={busy}
            canTestCandidateLoad={
              !!snapshot.python && snapshot.available && isCandidateInstalled
            }
            onLoad={onLoad}
            onHash={onHash}
          />
        </ModelSettingsInfoButton>
      </div>
      {component.problem && component.problem.status !== "success" && (
        <Text variant="xs" color="glyph-warning">
          {component.problem.message}
        </Text>
      )}
    </div>
  );
};
