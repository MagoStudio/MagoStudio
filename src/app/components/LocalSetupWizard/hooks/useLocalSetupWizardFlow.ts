/* oxlint-disable custom-react/no-use-effect -- synchronize hardware probing with the selected wizard step */
/* oxlint-disable react-you-might-not-need-an-effect/no-event-handler -- no event ends these states; the timer that advances them is the external system being synchronised */
import { useLocalSetupDebugSetting } from "@hooks/userLocalStorage/useLocalSetupDebugSetting";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInterval } from "usehooks-ts";

import type { LocalSetupHardwareReport } from "../../../../../desktop/shared/contracts";
import { getModelLicensesAwaitingAcceptance } from "../../../../../desktop/shared/getModelLicensesAwaitingAcceptance";
import {
  ALWAYS_INSTALLED_MODEL_GROUP_IDS,
  type LocalModelGroupId
} from "../../../../../desktop/shared/localModelGroups";
import type { LocalModelLicense } from "../../../../../desktop/shared/localModelLicenses";
import {
  LOCAL_SETUP_REQUIRED_GIGABYTES,
  LocalSetupDrive
} from "../localSetupWizardStubs";
import { buildStarterInstallPreview } from "../utils/buildStarterInstallPreview";
import { licensesForModelGroups } from "../utils/licensesForModelGroups";
import { refreshModelSettings } from "../utils/refreshModelSettings";
import { requiredBytesForModelGroups } from "../utils/requiredBytesForModelGroups";
import { resolveModelGroupSelection } from "../utils/resolveModelGroupSelection";
import { simulateStarterInstallProgress } from "../utils/simulateStarterInstallProgress";

import { useLocalModelGroupsStatus } from "./useLocalModelGroupsStatus";

const readLocalSetupBridge = () => {
  const bridge = window.mago?.localSetup as
    | Partial<NonNullable<typeof window.mago>["localSetup"]>
    | undefined;
  return {
    probeHardware:
      typeof bridge?.probeHardware === "function" ? bridge.probeHardware : null,
    chooseFolder:
      typeof bridge?.chooseFolder === "function" ? bridge.chooseFolder : null
  };
};

export const UNREADABLE_HARDWARE_REPORT: LocalSetupHardwareReport = {
  graphicsCardName: "Unknown",
  videoMemoryLabel: "Unknown",
  systemMemoryLabel: "Unknown",
  verdict: "blocked"
};

export type LocalSetupWizardState =
  | { step: "welcome" }
  | {
      step: "hardware";
      outcome: "checking" | "ready" | "limited" | "blocked";
      report: LocalSetupHardwareReport | null;
    }
  | { step: "models" }
  | {
      step: "storage";
      outcome: "choosing" | "insufficient";
      selectedDriveId: string;
      customDrive: LocalSetupDrive | null;
    }
  | { step: "licenses"; licensesAwaitingAcceptance: LocalModelLicense[] }
  | {
      step: "download";
      outcome: "downloading" | "paused" | "verifying" | "repairing" | "done";
      downloadedGigabytes: number;
      hasRepairedDamagedFiles: boolean;
    };

const INSTALLER_POLL_MS = 500;
const FAKE_DOWNLOAD_TICK_MS = 250;
const BYTES_PER_GIB = 1_073_741_824;
const ONE_DECIMAL_PLACE = 10;
const firstDriveId = "";

const toGigabytesWithOneDecimal = (bytes: number) =>
  Math.round((bytes / BYTES_PER_GIB) * ONE_DECIMAL_PLACE) / ONE_DECIMAL_PLACE;

const startedDownloadState = (): LocalSetupWizardState => ({
  step: "download",
  outcome: "downloading",
  downloadedGigabytes: 0,
  hasRepairedDamagedFiles: false
});

type FakeDownloadClock = {
  elapsedBeforePauseMs: number;
  resumedAtMs: number | null;
  nowMs: number;
};

const fakeDownloadElapsedMs = (clock: FakeDownloadClock) =>
  clock.elapsedBeforePauseMs +
  (clock.resumedAtMs === null ? 0 : clock.nowMs - clock.resumedAtMs);

export type LocalSetupWizardFlow = ReturnType<typeof useLocalSetupWizardFlow>;

export const useLocalSetupWizardFlow = () => {
  const { t } = useTranslation();
  const [isLocalSetupDebugEnabled] = useLocalSetupDebugSetting();
  const [state, setState] = useState<LocalSetupWizardState>({
    step: "welcome"
  });

  const [lastHardwareReport, setLastHardwareReport] =
    useState<LocalSetupHardwareReport | null>(null);
  const [previousStorageState, setPreviousStorageState] = useState<Extract<
    LocalSetupWizardState,
    { step: "storage" }
  > | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storagePending, setStoragePending] = useState(false);
  const [licensesError, setLicensesError] = useState<string | null>(null);
  const [licensesPending, setLicensesPending] = useState(false);
  const [fakeDownloadClock, setFakeDownloadClock] =
    useState<FakeDownloadClock | null>(null);
  const [isUpdatingInstallation, setIsUpdatingInstallation] = useState(false);
  const [modelGroupChoices, setModelGroupChoices] = useState<
    Partial<Record<LocalModelGroupId, boolean>>
  >({});
  const [confirmedModelGroupIds, setConfirmedModelGroupIds] = useState<
    LocalModelGroupId[]
  >([...ALWAYS_INSTALLED_MODEL_GROUP_IDS]);
  const [confirmedRequiredBytes, setConfirmedRequiredBytes] = useState<
    number | null
  >(null);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelsPending, setModelsPending] = useState(false);
  const modelGroupsStatus = useLocalModelGroupsStatus({
    isLocalModelGroupsStatusNeeded: state.step === "models"
  });
  const modelGroups = (modelGroupsStatus.data?.groups ?? []).map((group) => ({
    ...group,
    ...resolveModelGroupSelection({
      groupId: group.groupId,
      state: group.state,
      userChoice: modelGroupChoices[group.groupId]
    })
  }));
  const checkedModelGroupIds = modelGroups
    .filter((group) => group.isChecked)
    .map((group) => group.groupId);
  const requiredGigabytes =
    confirmedRequiredBytes === null
      ? LOCAL_SETUP_REQUIRED_GIGABYTES
      : toGigabytesWithOneDecimal(confirmedRequiredBytes);
  const volumes = useQuery({
    queryKey: ["local-setup-drives"],
    queryFn: () => window.mago.localSetup.listDrives(),
    enabled: state.step === "storage",
    staleTime: 0
  });
  const drives = [
    ...(volumes.data ?? []),
    ...(state.step === "storage" && state.customDrive
      ? [state.customDrive]
      : [])
  ];
  const selectedDriveId =
    state.step === "storage"
      ? state.selectedDriveId ||
        drives.find((drive) => (drive.freeGigabytes ?? -1) >= requiredGigabytes)
          ?.id ||
        drives[0]?.id ||
        ""
      : "";
  const selectedDrive = drives.find((drive) => drive.id === selectedDriveId);
  const refreshStorage = async () => {
    setStorageError(null);
    await volumes.refetch();
    if (state.step === "storage" && state.customDrive) {
      try {
        const result = await window.mago.localSetup.selectStorageFolder(
          state.customDrive.rootPath
        );
        setState((current) =>
          current.step === "storage" && current.customDrive
            ? {
                ...current,
                outcome: "choosing",
                customDrive: {
                  ...current.customDrive,
                  freeGigabytes: result.freeGigabytes
                }
              }
            : current
        );
      } catch (error) {
        setStorageError(
          error instanceof Error ? error.message : "Unable to read free space."
        );
      }
    } else
      setState((current) =>
        current.step === "storage"
          ? { ...current, outcome: "choosing" }
          : current
      );
  };
  const startInstallUnlessLicensesAwaitAcceptance = async (
    fromStep: "storage" | "models",
    modelGroupIds: LocalModelGroupId[]
  ) => {
    const licensesAwaitingAcceptance = getModelLicensesAwaitingAcceptance(
      await window.mago.localSetup.acceptedModelLicenseRepos(),
      licensesForModelGroups(modelGroupIds)
    );
    if (licensesAwaitingAcceptance.length > 0) {
      setLicensesError(null);
      setState((current) =>
        current.step === fromStep
          ? { step: "licenses", licensesAwaitingAcceptance }
          : current
      );
      return;
    }
    await window.mago.localSetup.startInstaller({ modelGroupIds });
    setState((current) =>
      current.step === fromStep ? startedDownloadState() : current
    );
  };
  const continueFromModels = async () => {
    if (state.step !== "models" || modelsPending || !modelGroupsStatus.data)
      return;
    const requiredBytes = requiredBytesForModelGroups({
      modelGroupsStatus: modelGroupsStatus.data,
      checkedModelGroupIds
    });
    setConfirmedModelGroupIds(checkedModelGroupIds);
    setConfirmedRequiredBytes(requiredBytes);
    setModelsError(null);
    if (!isUpdatingInstallation) {
      setState(
        previousStorageState ?? {
          step: "storage",
          outcome: "choosing",
          selectedDriveId: firstDriveId,
          customDrive: null
        }
      );
      return;
    }
    const freeBytes = modelGroupsStatus.data.installRootFreeBytes;
    if (freeBytes !== null && freeBytes < requiredBytes) {
      setModelsError(
        t("localSetup.models.insufficientSpace", {
          required: toGigabytesWithOneDecimal(requiredBytes),
          free: toGigabytesWithOneDecimal(freeBytes)
        })
      );
      return;
    }
    setModelsPending(true);
    try {
      await startInstallUnlessLicensesAwaitAcceptance(
        "models",
        checkedModelGroupIds
      );
    } catch (error) {
      setModelsError(
        error instanceof Error
          ? error.message
          : t("localSetup.models.startFailed")
      );
    } finally {
      setModelsPending(false);
    }
  };
  const startDownload = async () => {
    if (
      state.step !== "storage" ||
      !selectedDrive ||
      storagePending ||
      volumes.isFetching
    )
      return;
    setPreviousStorageState({ ...state, selectedDriveId });
    setFakeDownloadClock(null);
    setStoragePending(true);
    setStorageError(null);
    try {
      const result = await window.mago.localSetup.selectStorageFolder(
        selectedDrive.rootPath
      );
      if (
        result.freeGigabytes === null ||
        result.freeGigabytes < requiredGigabytes
      ) {
        await refreshStorage();
        setStorageError("Not enough free space at the selected location.");
        return;
      }
      await startInstallUnlessLicensesAwaitAcceptance(
        "storage",
        confirmedModelGroupIds
      );
    } catch (error) {
      setStorageError(
        error instanceof Error ? error.message : "Unable to select storage."
      );
    } finally {
      setStoragePending(false);
    }
  };
  const acceptModelLicensesAndStartDownload = async () => {
    if (state.step !== "licenses" || licensesPending) return;
    setLicensesPending(true);
    setLicensesError(null);
    try {
      await window.mago.localSetup.acceptModelLicenses(
        state.licensesAwaitingAcceptance.map(
          (license) => license.huggingFaceRepo
        )
      );
      await window.mago.localSetup.startInstaller({
        modelGroupIds: confirmedModelGroupIds
      });
      setState((current) =>
        current.step === "licenses" ? startedDownloadState() : current
      );
    } catch (error) {
      setLicensesError(
        error instanceof Error ? error.message : "Unable to start the download."
      );
    } finally {
      setLicensesPending(false);
    }
  };

  useEffect(() => {
    if (state.step === "hardware" && state.outcome === "checking") {
      let isStillChecking = true;
      const { probeHardware } = readLocalSetupBridge();
      const probe = probeHardware
        ? probeHardware()
        : Promise.resolve(UNREADABLE_HARDWARE_REPORT);

      void probe
        .catch(() => UNREADABLE_HARDWARE_REPORT)
        .then((report) => {
          if (!isStillChecking) return;
          setLastHardwareReport(report);
          setState({
            step: "hardware",
            outcome: report.verdict,
            report
          });
        });

      return () => {
        isStillChecking = false;
      };
    }
  }, [state]);

  const installer = useQuery({
    queryKey: ["starter-installer"],
    queryFn: () => window.mago.localSetup.installerStatus(),
    enabled: state.step === "download",
    refetchInterval: state.step === "download" ? INSTALLER_POLL_MS : false
  });
  const queryClient = useQueryClient();
  const installPhase = installer.data?.phase;
  // The installer completes asynchronously while the wizard may be collapsed.
  // Depend on the phase so subsequent "done" polls do not repeat the refresh.
  useEffect(() => {
    if (installPhase === "done") void refreshModelSettings(queryClient);
  }, [installPhase, queryClient]);
  const installerCommand = async (command: "start" | "pause" | "cancel") => {
    setStorageError(null);
    try {
      if (command !== "start") await window.mago.localSetup.pauseInstaller();
      else
        await window.mago.localSetup.startInstaller({
          modelGroupIds: confirmedModelGroupIds
        });
      await installer.refetch();
      if (command === "cancel") {
        setIsUpdatingInstallation(false);
        setState({ step: "welcome" });
      }
    } catch (error) {
      setStorageError(
        error instanceof Error ? error.message : "Installer action failed."
      );
    }
  };
  const isFakeDownloadActive =
    isLocalSetupDebugEnabled &&
    state.step === "download" &&
    fakeDownloadClock !== null;
  const fakeInstallStatus = isFakeDownloadActive
    ? simulateStarterInstallProgress(
        buildStarterInstallPreview(),
        fakeDownloadElapsedMs(fakeDownloadClock),
        fakeDownloadClock.resumedAtMs === null
      )
    : null;
  const isFakeDownloadTicking =
    fakeInstallStatus !== null &&
    fakeDownloadClock?.resumedAtMs != null &&
    fakeInstallStatus.phase !== "done";
  useInterval(
    () =>
      setFakeDownloadClock((clock) => clock && { ...clock, nowMs: Date.now() }),
    isFakeDownloadTicking ? FAKE_DOWNLOAD_TICK_MS : null
  );
  const installerStatus = fakeInstallStatus ?? installer.data;
  const pauseFakeDownload = () =>
    setFakeDownloadClock((clock) =>
      clock && clock.resumedAtMs !== null
        ? {
            elapsedBeforePauseMs: fakeDownloadElapsedMs({
              ...clock,
              nowMs: Date.now()
            }),
            resumedAtMs: null,
            nowMs: Date.now()
          }
        : clock
    );
  const resumeFakeDownload = () =>
    setFakeDownloadClock((clock) =>
      clock && clock.resumedAtMs === null
        ? { ...clock, resumedAtMs: Date.now(), nowMs: Date.now() }
        : clock
    );
  const startFakeDownload = () => {
    const nowMs = Date.now();
    setFakeDownloadClock({
      elapsedBeforePauseMs: 0,
      resumedAtMs: nowMs,
      nowMs
    });
  };
  const downloadState =
    state.step === "download" && installerStatus
      ? {
          ...state,
          outcome:
            installerStatus.phase === "done"
              ? ("done" as const)
              : installerStatus.phase === "paused"
                ? ("paused" as const)
                : installerStatus.phase === "error"
                  ? ("repairing" as const)
                  : installerStatus.phase === "verifying" ||
                      installerStatus.phase === "extracting" ||
                      installerStatus.phase === "installing-dependencies"
                    ? ("verifying" as const)
                    : ("downloading" as const),
          downloadedGigabytes:
            installerStatus.files.reduce(
              (sum, file) => sum + file.downloadedBytes,
              0
            ) / BYTES_PER_GIB
        }
      : state;
  const isModelsFirstStepOfModification =
    state.step === "models" && isUpdatingInstallation;
  const canGoBack =
    state.step !== "welcome" &&
    !isModelsFirstStepOfModification &&
    !storagePending &&
    !licensesPending &&
    !modelsPending &&
    (state.step !== "download" ||
      ["paused", "error", "done", "idle"].includes(
        installerStatus?.phase ?? ""
      ));
  const goBack = () => {
    if (!canGoBack) return;
    setFakeDownloadClock(null);
    setStorageError(null);
    setLicensesError(null);
    setModelsError(null);
    if (state.step === "hardware") setState({ step: "welcome" });
    else if (state.step === "models")
      setState({
        step: "hardware",
        outcome: lastHardwareReport?.verdict ?? "checking",
        report: lastHardwareReport
      });
    else if (state.step === "storage") {
      setPreviousStorageState({ ...state, selectedDriveId });
      setState({ step: "models" });
    } else if (isUpdatingInstallation) setState({ step: "models" });
    else if (state.step === "licenses" || state.step === "download") {
      setState(
        previousStorageState ?? {
          step: "storage",
          outcome: "choosing",
          selectedDriveId: firstDriveId,
          customDrive: null
        }
      );
    }
  };
  const doesSkipStartFakeDownload =
    state.step === "storage" || state.step === "licenses";
  const skipToNextStep = () => {
    if (!isLocalSetupDebugEnabled) return;
    if (state.step === "storage")
      setPreviousStorageState({ ...state, selectedDriveId });
    if (doesSkipStartFakeDownload) startFakeDownload();
    setState((current) => {
      if (current.step === "welcome") {
        return { step: "hardware", outcome: "checking", report: null };
      }
      if (current.step === "hardware") return { step: "models" };
      if (current.step === "models") {
        return {
          step: "storage",
          outcome: "choosing",
          selectedDriveId: firstDriveId,
          customDrive: null
        };
      }
      if (current.step === "storage" || current.step === "licenses")
        return startedDownloadState();
      return current;
    });
  };
  return {
    goBack,
    doesSkipStartFakeDownload,
    canGoBack,
    installer: installerStatus,
    installerError:
      storageError ??
      (installer.isError ? "Unable to read installer progress." : null),
    state:
      state.step === "storage" ? { ...state, selectedDriveId } : downloadState,
    drives,
    refreshStorage,
    storagePending: storagePending || volumes.isFetching,
    storageError:
      storageError ??
      (volumes.isError
        ? "Unable to list drives. Try again or choose a folder."
        : null),
    startHardwareCheck: () => {
      setIsUpdatingInstallation(false);
      setState({ step: "hardware", outcome: "checking", report: null });
    },
    continueToModels: () => setState({ step: "models" }),
    startUpdateInstallation: (
      preselectedModelGroupIds: LocalModelGroupId[]
    ) => {
      setIsUpdatingInstallation(true);
      setModelsError(null);
      setModelGroupChoices(
        Object.fromEntries(
          preselectedModelGroupIds.map((groupId) => [groupId, true])
        )
      );
      setState({ step: "models" });
    },
    isUpdatingInstallation,
    modelGroups,
    isModelGroupsStatusLoading: modelGroupsStatus.isPending,
    modelsError:
      modelsError ??
      (modelGroupsStatus.isError ? t("localSetup.models.loadError") : null),
    modelsPending,
    requiredGigabytes,
    toggleModelGroup: (groupId: LocalModelGroupId, isChecked: boolean) =>
      setModelGroupChoices((choices) => ({ ...choices, [groupId]: isChecked })),
    continueFromModels,
    selectDrive: (driveId: string) =>
      setState((current) => {
        const customDrive =
          current.step === "storage" ? current.customDrive : null;
        const drive = [...drives, customDrive]
          .filter((candidate): candidate is LocalSetupDrive =>
            Boolean(candidate)
          )
          .find((candidate) => candidate.id === driveId);
        const hasEnoughRoom = (drive?.freeGigabytes ?? 0) >= requiredGigabytes;
        return {
          step: "storage",
          outcome: hasEnoughRoom ? "choosing" : "insufficient",
          selectedDriveId: driveId,
          customDrive
        };
      }),
    chooseInstallFolder: () => {
      const { chooseFolder } = readLocalSetupBridge();
      if (!chooseFolder) return;
      setStorageError(null);
      void chooseFolder()
        .then((choice) => {
          if (!choice) return;
          const customDrive: LocalSetupDrive = {
            id: `folder:${choice.folderPath}`,
            name: choice.folderPath,
            rootPath: choice.folderPath,
            freeGigabytes: choice.freeGigabytes
          };
          setState((current) =>
            current.step !== "storage"
              ? current
              : {
                  step: "storage",
                  outcome:
                    (customDrive.freeGigabytes ?? -1) >= requiredGigabytes
                      ? "choosing"
                      : "insufficient",
                  selectedDriveId: customDrive.id,
                  customDrive
                }
          );
        })
        .catch((error) =>
          setStorageError(
            error instanceof Error ? error.message : "Unable to choose folder."
          )
        );
    },
    chooseAnotherDrive: () =>
      setState((current) => ({
        step: "storage",
        outcome: "choosing",
        selectedDriveId: firstDriveId,
        customDrive: current.step === "storage" ? current.customDrive : null
      })),
    startDownload,
    acceptModelLicensesAndStartDownload,
    licensesPending,
    licensesError,
    pauseDownload: () =>
      isFakeDownloadActive
        ? pauseFakeDownload()
        : void installerCommand("pause"),
    resumeDownload: () =>
      isFakeDownloadActive
        ? resumeFakeDownload()
        : void installerCommand("start"),
    cancelDownload: async () => {
      if (!isFakeDownloadActive) return installerCommand("cancel");
      setFakeDownloadClock(null);
      setIsUpdatingInstallation(false);
      setState({ step: "welcome" });
    },
    repairDamagedFiles: () => void installerCommand("start"),
    verifyAgain: () => void installer.refetch(),
    skipToNextStep
  };
};
