import { LaunchComfyButton } from "@app/components/LaunchComfyButton";
import { COMFY_LAUNCH_STATUS_QUERY_KEY } from "@app/components/LaunchComfyButton/hooks/useComfyLaunchStatus";
import { useMountEffect } from "@app/hooks/useMountEffect";
import { Checkbox } from "@components/Checkbox";
import { Icon } from "@components/Icon";
import { Input } from "@components/Input";
import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useLocalSetupDebugSetting } from "@hooks/userLocalStorage/useLocalSetupDebugSetting";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useId, useState } from "react";
import { Link as AriaLink } from "react-aria-components/Link";
import { useTranslation } from "react-i18next";

import { queryKeys } from "@/queryKeys";

import type { ScriptSetupRequirement } from "../../../../desktop/shared/contracts";

import { useIsComfyRespondingSinceFailedCheck } from "./hooks/useIsComfyRespondingSinceFailedCheck";
import { useModelLicenseAcceptanceGate } from "./hooks/useModelLicenseAcceptanceGate";
import { LocalModelLicenseDialog } from "./LocalModelLicenseDialog";
import { LocalNodePackUpdateDialog } from "./LocalNodePackUpdateDialog";
import { LocalSetupComfyRestartPrompt } from "./LocalSetupComfyRestartPrompt";
import { LocalSetupDownloadAllMissingButton } from "./LocalSetupDownloadAllMissingButton";
import { LocalSetupNodePackDependenciesNote } from "./LocalSetupNodePackDependenciesNote";
import { LocalSetupStatusMark } from "./LocalSetupStatusMark";
import { RecheckComfyConnectionOnMount } from "./RecheckComfyConnectionOnMount";
import { groupSetupRequirements } from "./utils/groupSetupRequirements";

const RequirementDownload = ({
  item,
  startDownloadOnceLicensesAccepted,
  onNodePackInstalled
}: {
  item: ScriptSetupRequirement;
  startDownloadOnceLicensesAccepted: (
    startDownload: () => void
  ) => Promise<void>;
  onNodePackInstalled: () => void;
}) => {
  const { t } = useTranslation();
  const download = useMutation({
    mutationFn: (replaceExistingNodePackIn?: string) =>
      window.mago.localSetup.downloadRequirement(item.name, {
        replaceExistingNodePackIn
      }),
    onSuccess: (result) => {
      const isNodePackLoadableAfterRestart =
        result?.outcome === "saved" &&
        item.installKind === "node" &&
        result.nodePackDependencies?.outcome !== "manual";
      if (isNodePackLoadableAfterRestart) onNodePackInstalled();
    }
  });
  const savedDownload =
    download.data?.outcome === "saved" ? download.data : null;
  const isNodePackReadyToLoad =
    savedDownload !== null &&
    item.installKind === "node" &&
    savedDownload.nodePackDependencies?.outcome !== "manual";
  const nodePackUpdateAwaitingConfirmation =
    download.data?.outcome === "node-pack-update-needs-confirmation"
      ? download.data
      : null;
  const requestDownload = useMutation({
    mutationFn: async () => {
      if (item.installKind !== "model") return download.mutate(undefined);
      await startDownloadOnceLicensesAccepted(() => download.mutate(undefined));
    }
  });
  if (!item.downloadUrl) return null;
  return (
    <div className="flex flex-col items-start gap-1">
      {!isNodePackReadyToLoad && (
        <MainButton
          startIcon={<Icon iconSet="16" iconName="download" />}
          colorScheme="secondary"
          isDisabled={download.isPending || requestDownload.isPending}
          loading={download.isPending}
          onPress={() => requestDownload.mutate()}
        >
          {download.isPending
            ? "Downloading / installing..."
            : download.isError
              ? "Resume / retry..."
              : item.installKind === "node"
                ? "Download and install..."
                : "Download..."}
        </MainButton>
      )}
      {download.isPending && (
        <MainButton
          colorScheme="secondary"
          onPress={() => {
            void window.mago.localSetup.pauseDownload(item.name);
          }}
        >
          Pause
        </MainButton>
      )}
      {download.isError && (
        <Text variant="xs" color="glyph-error">
          {download.error.message}
        </Text>
      )}
      {requestDownload.isError && (
        <Text variant="xs" color="glyph-error">
          {requestDownload.error.message}
        </Text>
      )}
      {savedDownload && (
        <Text variant="xs" color="success">
          {t(
            item.installKind === "node"
              ? "localSetup.requirementDownload.savedNodePack"
              : "localSetup.requirementDownload.savedModel",
            { savedTo: savedDownload.savedTo }
          )}
        </Text>
      )}
      {savedDownload?.nodePackDependencies && (
        <LocalSetupNodePackDependenciesNote
          nodePackDependencies={savedDownload.nodePackDependencies}
        />
      )}
      {isNodePackReadyToLoad && (
        <Text variant="xs" color="glyph-warning">
          {t("localSetup.comfyRestart.waitingForRestart")}
        </Text>
      )}
      <LocalNodePackUpdateDialog
        nodePackDirectory={
          nodePackUpdateAwaitingConfirmation?.nodePackDirectory ?? null
        }
        backupsFolder={nodePackUpdateAwaitingConfirmation?.backupsFolder ?? ""}
        onCancel={() => download.reset()}
        onConfirm={() =>
          download.mutate(nodePackUpdateAwaitingConfirmation?.customNodesFolder)
        }
      />
    </div>
  );
};

const Requirements = ({
  title,
  items,
  debugMissing = false,
  startDownloadOnceLicensesAccepted,
  onNodePackInstalled
}: {
  title: string;
  items: ScriptSetupRequirement[];
  debugMissing?: boolean;
  startDownloadOnceLicensesAccepted: (
    startDownload: () => void
  ) => Promise<void>;
  onNodePackInstalled: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <LocalSetupStatusMark
          outcome={
            !debugMissing && items.every((item) => item.status === "installed")
              ? "success"
              : "error"
          }
        />
        <Text variant="sm">{title}</Text>
      </div>
      {groupSetupRequirements(items, debugMissing).map(({ item, names }) => (
        <div
          key={item.url + item.name}
          className="flex flex-col gap-1 wrap-anywhere"
        >
          <div className="flex items-center gap-2">
            <LocalSetupStatusMark outcome="error" />
            <AriaLink
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-glyph-action-main underline"
            >
              {item.installKind === "core"
                ? "Update ComfyUI"
                : item.installKind === "node"
                  ? item.url.split("/").at(-1)
                  : item.name}
            </AriaLink>
          </div>
          {(item.installKind === "core" || item.installKind === "node") && (
            <Text variant="xs" color="glyph-secondary">
              Missing or unverified nodes: {names.join(", ")}
            </Text>
          )}
          <Text variant="xs" color="glyph-secondary">
            {item.installNote
              ? item.installNote
              : item.installKind === "core"
                ? "Update ComfyUI and its Python dependencies, then restart ComfyUI."
                : item.installKind === "node"
                  ? t("localSetup.nodePackDependencies.rowHint", {
                      folder: item.folder
                    })
                  : `Download the model into ${item.folder}.`}
            {!debugMissing && item.status === "unknown"
              ? " Could not verify. Check the connection and required nodes, then check again."
              : ""}
          </Text>
          {item.pinnedRevision && (
            <Text variant="xs" color="glyph-secondary">
              Pinned bundle version: {item.pinnedRevision}
            </Text>
          )}
          <RequirementDownload
            item={item}
            startDownloadOnceLicensesAccepted={
              startDownloadOnceLicensesAccepted
            }
            onNodePackInstalled={onNodePackInstalled}
          />
        </div>
      ))}
      {!debugMissing && items.every((item) => item.status === "installed") && (
        <Text variant="sm" color="glyph-secondary">
          All installed.
        </Text>
      )}
    </div>
  );
};

const ConnectionForm = ({ onComplete }: { onComplete: () => void }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { startDownloadOnceLicensesAccepted, licenseDialogProps } =
    useModelLicenseAcceptanceGate();
  const [isLocalSetupDebugEnabled] = useLocalSetupDebugSetting();
  const [isDebugMissingChecked, setIsDebugMissingChecked] = useState(false);
  const debugMissing = isLocalSetupDebugEnabled && isDebugMissingChecked;
  const debugMissingCheckboxId = useId();
  const [editedEndpoint, setEditedEndpoint] = useState<string | null>(null);
  const [isComfyRestartNeeded, setIsComfyRestartNeeded] = useState(false);
  const markComfyRestartNeeded = () => setIsComfyRestartNeeded(true);
  const [completedComfyRestartCount, setCompletedComfyRestartCount] =
    useState(0);
  const settings = useQuery({
    queryKey: queryKeys.comfySettings.all,
    queryFn: () => window.mago.comfy.get(),
    staleTime: 0
  });
  const debugPreview = useQuery({
    queryKey: [
      "script-setup-debug",
      settings.data?.vlmBackend,
      settings.data?.scriptTextModel
    ],
    queryFn: () => window.mago.comfy.scriptSetupStatus({ debugMissing: true }),
    enabled: debugMissing,
    staleTime: 0
  });
  const endpoint = editedEndpoint ?? settings.data?.endpoint ?? "";
  const saveEndpoint = async (requestedEndpoint: string) => {
    const current = await window.mago.comfy.get();
    const status = await window.mago.comfy.save(
      {
        ...current,
        endpoint: requestedEndpoint
      },
      { completeSetupOnConnection: true }
    );
    void queryClient.invalidateQueries({
      queryKey: COMFY_LAUNCH_STATUS_QUERY_KEY
    });
    if (status.available)
      await queryClient.invalidateQueries({
        queryKey: ["starter-installer"]
      });
    queryClient.setQueryData(queryKeys.comfySettings.all, {
      ...current,
      endpoint: status.endpoint
    });
    return status;
  };
  const check = useMutation({
    mutationFn: async ({
      endpoint: requestedEndpoint,
      shouldSaveEndpoint
    }: {
      endpoint: string;
      shouldSaveEndpoint: boolean;
    }) => {
      const status = shouldSaveEndpoint
        ? await saveEndpoint(requestedEndpoint)
        : await window.mago.comfy.check(requestedEndpoint);
      if (!status.available)
        throw new Error(
          status.message ??
            "ComfyUI is unavailable. Start it and check the URL."
        );
      const setup = await window.mago.comfy.scriptSetupStatus({
        endpoint: status.endpoint
      });
      return { endpoint: status.endpoint, setup };
    },
    onSuccess: (result) => setEditedEndpoint(result.endpoint)
  });
  const checkEndpointWithoutSaving = (endpointToCheck: string) =>
    check.mutate({ endpoint: endpointToCheck, shouldSaveEndpoint: false });
  const checkEndpointUnlessAlreadyChecked = (endpointToCheck: string) => {
    const isEndpointAlreadyChecked =
      check.variables?.endpoint === endpointToCheck && !check.isError;
    if (
      !endpointToCheck.trim() ||
      debugMissing ||
      check.isPending ||
      isEndpointAlreadyChecked
    )
      return;
    checkEndpointWithoutSaving(endpointToCheck);
  };
  const isFailedEndpointTheSavedOne =
    check.variables?.endpoint === settings.data?.endpoint;
  const shouldRecheckBecauseComfyStartedResponding =
    useIsComfyRespondingSinceFailedCheck({
      isWaitingForComfyToRespond:
        !debugMissing && check.isError && isFailedEndpointTheSavedOne,
      failedCheckSubmittedAtMs: check.submittedAt
    });
  useMountEffect(() => {
    window.mago.comfy
      .get()
      .then((savedSettings) =>
        checkEndpointUnlessAlreadyChecked(savedSettings.endpoint)
      )
      .catch(() => undefined);
  });
  const result = debugMissing
    ? debugPreview.data
    : check.data?.endpoint === endpoint
      ? check.data.setup
      : null;
  const isComfyConnectedAtEndpoint = !debugMissing && result !== null;
  return (
    <div className="flex max-h-[70vh] flex-col gap-4">
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto scrollbar-custom">
        <LocalModelLicenseDialog {...licenseDialogProps} />
        {shouldRecheckBecauseComfyStartedResponding && (
          <RecheckComfyConnectionOnMount
            recheck={() => checkEndpointWithoutSaving(endpoint)}
          />
        )}
        <Text variant="sm" color="glyph-secondary">
          Connect your running ComfyUI to use local MiniMax video rendering in
          ScriptShot. This URL is shared with Settings.
        </Text>
        <Text variant="sm" color="glyph-secondary">
          The minimum setup uses cloud Gemini for text and cloud image models
          for sheets, with a signed-in cloud account. Qwen-VL captioning is
          optional; sheets already have casting descriptions.
        </Text>
        <label className="flex flex-col gap-1">
          <Text variant="sm">ComfyUI URL</Text>
          <Input
            aria-label="ComfyUI URL"
            autoComplete="off"
            placeholder="http://127.0.0.1:8188"
            value={endpoint}
            disabled={check.isPending || settings.isPending}
            onChange={(event) => {
              setEditedEndpoint(event.target.value);
              check.reset();
            }}
            onBlur={() => checkEndpointUnlessAlreadyChecked(endpoint)}
          />
        </label>
        {settings.isError && (
          <Text variant="sm">
            Unable to load ComfyUI settings. {settings.error.message}
          </Text>
        )}
        {isLocalSetupDebugEnabled && (
          <Checkbox
            inputId={debugMissingCheckboxId}
            isChecked={debugMissing}
            disabled={check.isPending}
            onChange={(event) => setIsDebugMissingChecked(event.target.checked)}
            label="Debug: show all requirements as missing"
          />
        )}
        {debugMissing && (
          <Text variant="xs" color="glyph-secondary">
            Preview only. No connection check or settings changes. Uncheck to
            return to real results.
          </Text>
        )}
        {isComfyConnectedAtEndpoint && (
          <MainButton
            colorScheme="primary"
            loading={check.isPending}
            isDisabled={
              !endpoint.trim() || settings.isPending || check.isPending
            }
            onPress={() => check.mutate({ endpoint, shouldSaveEndpoint: true })}
          >
            {check.isPending
              ? t("localSetup.existingComfy.checking")
              : "Save and check setup"}
          </MainButton>
        )}
        <div aria-live="polite" className="flex flex-col gap-4">
          {!debugMissing && check.isPending && !isComfyConnectedAtEndpoint && (
            <Text variant="sm" color="glyph-secondary">
              {t("localSetup.existingComfy.checking")}
            </Text>
          )}
          {!debugMissing && check.isError && (
            <>
              <div className="flex items-center gap-2">
                <LocalSetupStatusMark outcome="error" />
                <Text variant="sm">{check.error.message}</Text>
              </div>
              <LaunchComfyButton />
            </>
          )}
          {debugMissing && debugPreview.isPending && (
            <Text variant="sm">Loading missing requirements preview...</Text>
          )}
          {debugMissing && debugPreview.isError && (
            <Text variant="sm">
              Unable to load preview: {debugPreview.error.message}
            </Text>
          )}
          {result && (
            <Fragment key={completedComfyRestartCount}>
              <div className="flex items-center gap-2">
                <LocalSetupStatusMark
                  outcome={result.ready && !debugMissing ? "success" : "error"}
                />
                <Text variant="sm">
                  {debugMissing
                    ? "Debug preview: all setup checks failed."
                    : result.ready
                      ? "ComfyUI connected. The minimum 4-step ScriptShot setup is installed."
                      : "ComfyUI connected. Install the requirements below, restart ComfyUI, then check again."}
                </Text>
              </div>
              <Text variant="xs" color="glyph-secondary">
                Checks the base MiniMax model, vanilla MiniMax text encoder,
                video/audio VAEs and 4-step LoRA. This checks installed files
                and nodes; it does not run a test render. Optional nodes are
                included below but do not block the minimum setup. Folder paths
                are best-effort destinations on the ComfyUI server. Downloads
                are saved on this computer; for a remote server, transfer them
                to the displayed server folder.
              </Text>
              <Requirements
                onNodePackInstalled={markComfyRestartNeeded}
                startDownloadOnceLicensesAccepted={
                  startDownloadOnceLicensesAccepted
                }
                debugMissing={debugMissing}
                title="ComfyUI and node packs (including optional features)"
                items={[
                  ...result.nodes,
                  ...result.highQuality.filter(
                    (item) => item.installKind !== "model"
                  ),
                  ...result.optional.flatMap((group) =>
                    group.requirements.filter(
                      (item) => item.installKind !== "model"
                    )
                  )
                ]}
              />
              <Requirements
                onNodePackInstalled={markComfyRestartNeeded}
                startDownloadOnceLicensesAccepted={
                  startDownloadOnceLicensesAccepted
                }
                debugMissing={debugMissing}
                title="Required models"
                items={result.models}
              />
              <Requirements
                onNodePackInstalled={markComfyRestartNeeded}
                startDownloadOnceLicensesAccepted={
                  startDownloadOnceLicensesAccepted
                }
                debugMissing={debugMissing}
                title="Optional: 8-step slow rendering"
                items={result.highQuality.filter(
                  (item) => item.installKind === "model"
                )}
              />
              <Text variant="xs" color="glyph-secondary">
                Use Fast rendering with the minimum setup. Slow rendering also
                needs the 8-step accelerator above.
              </Text>
              <details
                key={`vfx-loras-${String(debugMissing)}`}
                open={debugMissing || undefined}
                className="flex flex-col gap-3"
              >
                <summary className="cursor-pointer text-sm text-glyph-primary">
                  {t("localSetup.existingComfy.vfxLoras.title")}
                </summary>
                <div className="flex flex-col gap-4 pt-3">
                  <Text variant="xs" color="glyph-secondary">
                    {t("localSetup.existingComfy.vfxLoras.description")}
                  </Text>
                  <LocalSetupDownloadAllMissingButton
                    batchName="vfx-loras"
                    items={result.vfxLoras}
                    debugMissing={debugMissing}
                  />
                  <Requirements
                    onNodePackInstalled={markComfyRestartNeeded}
                    debugMissing={debugMissing}
                    title={t("localSetup.existingComfy.vfxLoras.title")}
                    items={result.vfxLoras}
                    startDownloadOnceLicensesAccepted={
                      startDownloadOnceLicensesAccepted
                    }
                  />
                </div>
              </details>
              <details
                key={String(debugMissing)}
                open={debugMissing || undefined}
                className="flex flex-col gap-3"
              >
                <summary className="cursor-pointer text-sm text-glyph-primary">
                  Optional local models: Qwen Image, Qwen-VL and Qwen3.8
                </summary>
                <div className="flex flex-col gap-4 pt-3">
                  <Text variant="xs" color="glyph-secondary">
                    These checks do not affect the minimum setup. Captioning and
                    text checks use the models selected in Settings. Installed
                    models are not automatically enabled.
                  </Text>
                  {result.optional.map((group) => (
                    <Requirements
                      onNodePackInstalled={markComfyRestartNeeded}
                      startDownloadOnceLicensesAccepted={
                        startDownloadOnceLicensesAccepted
                      }
                      debugMissing={debugMissing}
                      key={group.title}
                      title={group.title}
                      items={group.requirements.filter(
                        (item) => item.installKind === "model"
                      )}
                    />
                  ))}
                </div>
              </details>
              {!debugMissing && result.ready && (
                <MainButton
                  colorScheme="primary"
                  loading={check.isPending}
                  isDisabled={check.isPending}
                  onPress={() =>
                    check.mutate(
                      { endpoint, shouldSaveEndpoint: true },
                      { onSuccess: onComplete }
                    )
                  }
                >
                  Use this ComfyUI
                </MainButton>
              )}
            </Fragment>
          )}
        </div>
      </div>
      {isComfyRestartNeeded && (
        <div className="border-t border-element-primary pt-3">
          <LocalSetupComfyRestartPrompt
            onRestarted={() => {
              setIsComfyRestartNeeded(false);
              setCompletedComfyRestartCount((count) => count + 1);
              checkEndpointWithoutSaving(endpoint);
            }}
          />
        </div>
      )}
    </div>
  );
};

export const LocalSetupExistingComfyDialog = ({
  isOpen,
  onClose,
  onComplete
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      width="sm"
      title={t("localSetup.existingComfy.title", {
        defaultValue: "Using your own ComfyUI"
      })}
    >
      {isOpen && <ConnectionForm onComplete={onComplete} />}
    </Modal>
  );
};
