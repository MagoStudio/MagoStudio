import { SetupMagoStudioButton } from "@app/components/LocalSetupWizard/SetupMagoStudioButton";
import { refreshModelSettings } from "@app/components/LocalSetupWizard/utils/refreshModelSettings";
import { Text } from "@components/Text";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { defaultModelPreferences } from "../../../../../../../desktop/shared/defaultModelPreferences";
import { findFilenameIgnoringCase } from "../../../../../../../desktop/shared/findFilenameIgnoringCase";
import { LOCAL_MODEL_DEFINITIONS } from "../../../../../../../desktop/shared/localModelDefinitions";
import type {
  LocalModelType,
  ModelCheckRequest,
  ModelComponent,
  ModelOperationResult,
  ModelPreferences,
  ModelSettingsSnapshot
} from "../../../../../../../desktop/shared/modelSettings";

import { localModelSettingsQueryOptions } from "./localModelSettingsQueryOptions";
import { MissingModelNodes } from "./MissingModelNodes";
import { ModelFilesEditor } from "./ModelFilesEditor";
import { ModelLoadEditor } from "./ModelLoadEditor";
import { ModelSettingsField } from "./ModelSettingsField";
import type {
  ModelSettingsOperation,
  ModelSettingsOperationSlot
} from "./modelSettingsOperation";
import { ModelTypeSelect } from "./ModelTypeSelect";
import { resolveModelFileInUse } from "./resolveModelFileInUse";

export const LocalModelSettingsPanel = ({
  endpoint,
  onSaved,
  onSetup
}: {
  endpoint: string;
  onSaved?: () => Promise<void>;
  onSetup?: () => void;
}) => {
  const { t } = useTranslation(),
    queryClient = useQueryClient();
  const [model, setModel] = useState<LocalModelType>("text");
  const [role, setRole] = useState<ModelComponent>("main");
  const [candidate, setCandidate] = useState("");
  const [draft, setDraft] = useState<{
    key: string;
    preferences: ModelPreferences;
    memory: "auto" | "low-vram";
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [operation, setOperation] = useState<
    (ModelSettingsOperation & { key: string }) | null
  >(null);
  const definition = LOCAL_MODEL_DEFINITIONS.find(
    (definition) => definition.id === model
  )!;
  const key = `${endpoint}:${model}`;
  const { queryKey } = localModelSettingsQueryOptions(endpoint, model);
  const modelQueries = useQueries({
    queries: LOCAL_MODEL_DEFINITIONS.map((definition) =>
      localModelSettingsQueryOptions(endpoint, definition.id)
    )
  });
  const query =
    modelQueries[
      LOCAL_MODEL_DEFINITIONS.findIndex((definition) => definition.id === model)
    ];
  const snapshot = query.data;
  const preferences =
    draft?.key === key
      ? draft.preferences
      : (snapshot?.settings.models[model] ??
        defaultModelPreferences(definition.defaultVariant));
  const memory =
    draft?.key === key
      ? draft.memory
      : (snapshot?.settings.memoryPolicy ?? "auto");
  const component =
    snapshot?.components.find((component) => component.role === role) ??
    snapshot?.components[0];
  const requestedCandidate = candidate || component?.selectedFile || "";
  const installedFilenames =
    component?.choices.map((choice) => choice.filename) ?? [];
  const selectableFilenames = component
    ? [component.recommendedFile.filename, ...installedFilenames]
    : [];
  const selectedCandidate =
    findFilenameIgnoringCase(selectableFilenames, requestedCandidate) ?? "";
  const isCandidateInstalled = installedFilenames.includes(selectedCandidate);
  const recommendedFilename = component?.recommendedFile.filename ?? "";
  const filenameInUse = component ? resolveModelFileInUse(component) : "";
  const showOperation = (
    slot: ModelSettingsOperationSlot,
    outcome: ModelSettingsOperation["outcome"]
  ) => setOperation({ key, slot, outcome });
  const failureOf = (error: unknown): ModelOperationResult => ({
    status: "error",
    message:
      error instanceof Error
        ? error.message
        : t("modelSettings.operationFailed")
  });
  const changePreferences = (value: ModelPreferences) =>
    setDraft({ key, preferences: value, memory });
  const save = async (next = preferences) => {
    const saved = await window.mago.models.save({
      endpoint,
      model,
      preferences: next,
      memoryPolicy: memory
    });
    queryClient.setQueryData(queryKey, saved);
    setDraft(null);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["settings-script-text-status"]
      }),
      queryClient.invalidateQueries({
        queryKey: ["model-diagnostics", endpoint]
      }),
      queryClient.invalidateQueries({ queryKey: ["comfy-model-status"] }),
      queryClient.invalidateQueries({
        queryKey: ["local-model-groups-status"]
      }),
      queryClient.invalidateQueries({ queryKey: ["local-script-setup"] }),
      queryClient.invalidateQueries({ queryKey: ["local-video-setup"] })
    ]);
    await onSaved?.();
    return saved;
  };
  const performSave = async (
    slot: ModelSettingsOperationSlot,
    next = preferences,
    {
      resultsBeforeSave = [],
      detailsOfSave
    }: {
      resultsBeforeSave?: ModelOperationResult[];
      detailsOfSave?: ModelOperationResult["details"];
    } = {}
  ) => {
    const restartRequired = memory !== snapshot?.settings.memoryPolicy;
    setBusy(true);
    showOperation(slot, "running");
    try {
      await save(next);
      showOperation(slot, [
        ...resultsBeforeSave,
        {
          status: "success",
          message: t(
            restartRequired
              ? "modelSettings.savedRestart"
              : "modelSettings.saved"
          ),
          details: detailsOfSave
        }
      ]);
    } catch (error) {
      showOperation(slot, [...resultsBeforeSave, failureOf(error)]);
    } finally {
      setBusy(false);
    }
  };
  const check = async (
    slot: ModelSettingsOperationSlot,
    action: ModelCheckRequest["action"],
    file = selectedCandidate,
    checkedRole = component?.role ?? "main"
  ): Promise<ModelOperationResult> => {
    setBusy(true);
    showOperation(slot, "running");
    try {
      if (action === "load") await save();
      const value = await window.mago.models.check({
        endpoint,
        model,
        action,
        role: checkedRole,
        filename: file
      });
      showOperation(slot, [value]);
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({
        queryKey: ["model-diagnostics", endpoint]
      });
      return value;
    } catch (error) {
      const failure = failureOf(error);
      showOperation(slot, [failure]);
      return failure;
    } finally {
      setBusy(false);
    }
  };
  type SettingsBasis = {
    snapshot: ModelSettingsSnapshot;
    component: ModelSettingsSnapshot["components"][number];
    preferences: ModelPreferences;
  };
  const currentBasis =
    snapshot && component ? { snapshot, component, preferences } : null;
  const readLatestSettingsBasis = async (): Promise<SettingsBasis> => {
    const latestSnapshot = await queryClient.fetchQuery(
      localModelSettingsQueryOptions(endpoint, model)
    );
    return {
      snapshot: latestSnapshot,
      component:
        latestSnapshot.components.find(
          (latestComponent) => latestComponent.role === component?.role
        ) ?? latestSnapshot.components[0],
      preferences:
        draft?.key === key
          ? draft.preferences
          : (latestSnapshot.settings.models[model] ??
            defaultModelPreferences(definition.defaultVariant))
    };
  };
  const revertToRecommendedFile = async (
    basis: SettingsBasis | null = currentBasis
  ) => {
    if (!basis) return;
    const bindings = { ...basis.preferences.bindings };
    delete bindings[`${basis.snapshot.variant}:${basis.component.role}`];
    await performSave("restore", { ...basis.preferences, bindings });
  };
  const adoptFileOnceCompatible = async (
    filename: string,
    basis: SettingsBasis | null = currentBasis
  ) => {
    if (!basis) return;
    const pickedFile = basis.component.choices.find(
      (choice) => choice.filename === filename
    );
    if (pickedFile?.loadTestOutcome === "failed") {
      showOperation("useFile", [
        { status: "error", message: t("modelSettings.fileFailedLoadTest") }
      ]);
      return;
    }
    const hasFilePassedLoadTest = pickedFile?.loadTestOutcome === "passed";
    const compatibility = await check(
      "useFile",
      "compatibility",
      filename,
      basis.component.role
    );
    const isCandidateUsable =
      compatibility.status === "success" ||
      (compatibility.status === "unknown" && hasFilePassedLoadTest);
    if (!isCandidateUsable) return;
    const variant = basis.snapshot.variant;
    await performSave(
      "useFile",
      {
        ...basis.preferences,
        variant: model === "text" ? variant : basis.preferences.variant,
        bindings: {
          ...basis.preferences.bindings,
          [`${variant}:${basis.component.role}`]: filename
        }
      },
      compatibility.status === "success"
        ? { detailsOfSave: compatibility.details }
        : { resultsBeforeSave: [compatibility] }
    );
  };
  const selectFileAndUseItOnceCompatible = (filename: string) => {
    setCandidate(filename);
    setOperation(null);
    if (!component) return;
    const isFileAlreadyInUse = filename === filenameInUse;
    if (isFileAlreadyInUse) return;
    const areFileNodesMissing = component.choices.some(
      (choice) => choice.filename === filename && choice.missingNodes.length > 0
    );
    if (areFileNodesMissing) return;
    const isRecommendedFile = filename === recommendedFilename;
    if (isRecommendedFile) {
      if (component.recommendedFile.isInstalled) void revertToRecommendedFile();
      return;
    }
    const isFileInstalled = component.choices.some(
      (choice) => choice.filename === filename
    );
    if (isFileInstalled) void adoptFileOnceCompatible(filename);
  };
  const pickedFileMissingNodes =
    component?.choices.find((choice) => choice.filename === selectedCandidate)
      ?.missingNodes ?? [];
  const switchToPickedFileOnceComfyRestarted = async () => {
    await refreshModelSettings(queryClient);
    if (!component) return;
    const latestBasis = await readLatestSettingsBasis();
    const refreshedPickedFile = latestBasis.component.choices.find(
      (choice) => choice.filename === selectedCandidate
    );
    const arePickedFileNodesInstalled =
      refreshedPickedFile !== undefined &&
      refreshedPickedFile.missingNodes.length === 0;
    const isPickedFileWaitingToBeUsed =
      selectedCandidate !== resolveModelFileInUse(latestBasis.component);
    if (!arePickedFileNodesInstalled || !isPickedFileWaitingToBeUsed) return;
    if (selectedCandidate === latestBasis.component.recommendedFile.filename)
      await revertToRecommendedFile(latestBasis);
    else await adoptFileOnceCompatible(selectedCandidate, latestBasis);
  };
  const testCandidateLoadAndUseItOncePassed = async () => {
    const loadTest = await check("testCandidate", "load");
    const testedFilename = selectedCandidate;
    const isTestedFileWaitingToBeUsed =
      testedFilename !== filenameInUse &&
      testedFilename !== recommendedFilename;
    if (loadTest.status !== "success" || !isTestedFileWaitingToBeUsed) return;
    await adoptFileOnceCompatible(
      testedFilename,
      await readLatestSettingsBasis()
    );
  };
  const visibleOperation = operation?.key === key ? operation : null;
  return (
    <div className="flex flex-col gap-3 border-t border-element-primary pt-3">
      <Text variant="sm" weight="bold">
        {t("modelSettings.heading")}
      </Text>
      <ModelSettingsField label={t("modelSettings.modelType")}>
        <ModelTypeSelect
          value={model}
          disabled={busy}
          snapshots={modelQueries.map((query) => query.data)}
          onChange={(model) => {
            setModel(model);
            setRole("main");
            setCandidate("");
            setDraft(null);
            setOperation(null);
          }}
        />
      </ModelSettingsField>
      {query.isPending && (
        <Text variant="xs" color="glyph-tertiary">
          {t("modelSettings.checking")}
        </Text>
      )}
      {query.error && (
        <Text variant="xs" color="glyph-error">
          {query.error.message}
        </Text>
      )}
      {snapshot && (
        <>
          {(snapshot.components.some(
            (component) => component.status === "missing"
          ) ||
            !snapshot.loadersAvailable) && (
            <SetupMagoStudioButton onOpen={onSetup} />
          )}
          {snapshot.isLlamaCppPackageInstalled === false && (
            <Text variant="xs" color="glyph-error">
              {t("modelSettings.llamaCppPackageMissing")}
            </Text>
          )}
          {snapshot.missingWorkflowNodes.length > 0 && (
            <MissingModelNodes
              heading={t("modelSettings.missingWorkflowNodesHeading", {
                model: definition.label
              })}
              hint={t("modelSettings.missingWorkflowNodesHint", {
                model: definition.label
              })}
              missingNodes={snapshot.missingWorkflowNodes}
              onComfyRestarted={() => void refreshModelSettings(queryClient)}
            />
          )}
          {pickedFileMissingNodes.length > 0 && (
            <MissingModelNodes
              heading={t("modelSettings.missingNodesHeading", {
                file: selectedCandidate
              })}
              hint={t("modelSettings.missingNodesHint")}
              missingNodes={pickedFileMissingNodes}
              onComfyRestarted={() =>
                void switchToPickedFileOnceComfyRestarted()
              }
            />
          )}
          <section className="flex flex-col gap-3 border-t border-element-primary pt-3">
            <Text component="h3" variant="sm" weight="bold">
              {t("modelSettings.filesHeading")}
            </Text>
            <ModelFilesEditor
              definition={definition}
              snapshot={snapshot}
              preferences={preferences}
              role={component?.role ?? "main"}
              candidate={selectedCandidate}
              isCandidateInstalled={isCandidateInstalled}
              busy={busy}
              operation={visibleOperation}
              onVariant={(value) => {
                setRole("main");
                setCandidate("");
                void performSave("variant", { ...preferences, variant: value });
              }}
              onRole={(role) => {
                setRole(role);
                setCandidate("");
                setOperation(null);
              }}
              onCandidate={selectFileAndUseItOnceCompatible}
              onLoad={() => void testCandidateLoadAndUseItOncePassed()}
              onHash={() => void check("hash", "hash", selectedCandidate)}
              onRecommendedFileDownloaded={() =>
                void refreshModelSettings(queryClient)
              }
            />
          </section>
          <section className="flex flex-col gap-3 border-t border-element-primary pt-3">
            <Text component="h3" variant="sm" weight="bold">
              {t("modelSettings.loadHeading")}
            </Text>
            <ModelLoadEditor
              definition={definition}
              snapshot={snapshot}
              preferences={preferences}
              memoryPolicy={memory}
              busy={busy}
              operation={visibleOperation}
              onChange={changePreferences}
              onMemoryPolicy={(memory) =>
                setDraft({ key, preferences, memory })
              }
              onSave={() => void performSave("saveLoad")}
              onCheck={() => void check("runtime", "runtime")}
              onRepair={() => void check("repair", "repair")}
              onLoad={() =>
                void check(
                  "testLoad",
                  "load",
                  snapshot.components[0].selectedFile,
                  "main"
                )
              }
            />
          </section>
        </>
      )}
    </div>
  );
};
