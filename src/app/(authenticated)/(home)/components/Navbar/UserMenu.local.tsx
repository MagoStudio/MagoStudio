"use client";

import { LaunchComfyOrSetupMagoStudioButton } from "@app/components/ComfyLaunchDialog/LaunchComfyOrSetupMagoStudioButton";
import { useComfyLaunchStatus } from "@app/components/LaunchComfyButton/hooks/useComfyLaunchStatus";
import { LocalSetupStatusMark } from "@app/components/LocalSetupWizard/LocalSetupStatusMark";
import { CircularProgress } from "@components/CircularProgress";
import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { Input } from "@components/Input";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import { isCloudAccountActive } from "@/platform/cloudAccount";
import { useClerk, useUser } from "@/platform/identity";
import { OPEN_CREDENTIALS_EVENT } from "@/platform/localDesktop";
import {
  PROVIDER_PREFERENCES_EVENT,
  ProviderPreferences,
  readProviderPreferences
} from "@/platform/providerPreferences";
import { queryKeys } from "@/queryKeys";

import type {
  ComfyStatus,
  LibraryInfo,
  LocalScriptTextModel,
  LocalTextModelProvider,
  LocalVlmBackend
} from "../../../../../../desktop/shared/contracts";

import { CloudAccountBillingActions } from "./CloudAccountBillingActions";
import { LocalAppVersion } from "./LocalAppVersion";
import { LocalSetupDebugSetting } from "./LocalSetupDebugSetting";

const DEFAULT_COMFY_ENDPOINT = "http://127.0.0.1:8188";
const DEFAULT_VLM_BACKEND: LocalVlmBackend = "qwen3-vl-4b-heretic-int8";
const DEFAULT_SCRIPT_TEXT_MODEL: LocalScriptTextModel = "qwen38-27b-q5";
const DEFAULT_TEXT_MODEL_PROVIDER: LocalTextModelProvider = "cloud";

const SettingsStatusMark = ({
  ready,
  label
}: {
  ready: boolean | null;
  label: string;
}) => (
  <span
    aria-label={
      label +
      (ready === null ? ": checking" : ready ? ": ready" : ": needs attention")
    }
  >
    {ready === null ? (
      <CircularProgress size="xs" aria-label={"Checking " + label} />
    ) : (
      <LocalSetupStatusMark outcome={ready ? "success" : "error"} />
    )}
  </span>
);

export function UserMenu() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<LibraryInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comfyEndpoint, setComfyEndpoint] = useState(DEFAULT_COMFY_ENDPOINT);
  const [vlmBackend, setVlmBackend] =
    useState<LocalVlmBackend>(DEFAULT_VLM_BACKEND);
  const [scriptTextModel, setScriptTextModel] = useState<LocalScriptTextModel>(
    DEFAULT_SCRIPT_TEXT_MODEL
  );
  const [textModelProvider, setTextModelProvider] =
    useState<LocalTextModelProvider>(DEFAULT_TEXT_MODEL_PROVIDER);
  const [comfyStatus, setComfyStatus] = useState<ComfyStatus | null>(null);
  const comfyLaunchStatus = useComfyLaunchStatus({
    isComfyLaunchStatusNeeded: open
  });
  const isSavedComfyEndpointUnavailable =
    comfyLaunchStatus.data?.available === false;

  const [isComfyActionPending, setIsComfyActionPending] = useState(false);
  const [credentialPromptReason, setCredentialPromptReason] = useState<
    "generate" | "comfy" | null
  >(null);
  const [providerPreferences, setProviderPreferences] =
    useState<ProviderPreferences>(readProviderPreferences);
  const [isSignInPending, setIsSignInPending] = useState(false);

  const endpointCheckId = useRef(0);
  const settingsLoaded = useRef(false);
  const [checkingEndpoint, setCheckingEndpoint] = useState(false);
  const validateEndpoint = async () => {
    const id = ++endpointCheckId.current;
    setCheckingEndpoint(true);
    try {
      const result = await window.mago.comfy.check(comfyEndpoint);
      if (id === endpointCheckId.current) {
        setComfyEndpoint(result.endpoint);
        setComfyStatus(result);
      }
    } catch (error) {
      if (id === endpointCheckId.current)
        setComfyStatus({
          endpoint: comfyEndpoint,
          vlmBackend,
          scriptTextModel,
          textModelProvider,
          configured: false,
          available: false,
          message:
            error instanceof Error ? error.message : "Unable to check ComfyUI"
        });
    } finally {
      if (id === endpointCheckId.current) setCheckingEndpoint(false);
    }
  };

  const savedEndpointMatches = comfyStatus?.endpoint === comfyEndpoint;
  const textCheck = useQuery({
    queryKey: [
      "settings-script-text-status",
      comfyStatus?.endpoint,
      scriptTextModel,
      vlmBackend
    ],
    queryFn: () =>
      window.mago.comfy.scriptSetupStatus({
        endpoint: comfyStatus?.endpoint,
        scriptTextModel,
        vlmBackend
      }),
    enabled: open && comfyStatus?.available === true && savedEndpointMatches,
    retry: false,
    staleTime: 0
  });
  const connectionReady = checkingEndpoint
    ? null
    : comfyStatus
      ? savedEndpointMatches && comfyStatus.available
      : null;
  const connectionHint = !savedEndpointMatches
    ? "Leave this field to check the endpoint."
    : (comfyStatus?.message ??
      "ComfyUI is not responding. Start it or finish local setup.");
  const textRequirements = textCheck.data?.optional.find(
    (group) => group.id === "script-text"
  )?.requirements;
  const requirementsReady = (requirements: typeof textRequirements) => {
    if (connectionReady === false || textCheck.isError) return false;
    if (textCheck.isFetching) return null;
    return requirements
      ? requirements.length > 0 &&
          requirements.every((item) => item.status === "installed")
      : textCheck.data
        ? false
        : null;
  };
  const scriptReady = requirementsReady(textRequirements);
  const missingText = textRequirements
    ?.filter((item) => item.status !== "installed")
    .map((item) => item.name)
    .join(", ");
  const scriptHint =
    connectionReady === false
      ? "Connect ComfyUI above to check this model."
      : (textCheck.error?.message ??
        (missingText
          ? "Missing or unavailable: " +
            missingText +
            ". Install these through local setup, then restart ComfyUI."
          : "Unable to verify the selected text model. Select it again to retry."));
  const usesCloudText =
    textModelProvider === "cloud" && providerPreferences["mago-cloud"];
  const providerReady = usesCloudText ? isCloudAccountActive() : scriptReady;
  const providerHint = usesCloudText
    ? "Sign in to Mago to use cloud text generation. Otherwise it falls back to the local text model."
    : scriptHint;

  const openSettings = useCallback(async () => {
    settingsLoaded.current = false;
    setOpen(true);
    setError(null);
    setComfyStatus(null);
    try {
      const [selectedLibrary, comfy] = await Promise.all([
        window.mago.library.get(),
        window.mago.comfy.check()
      ]);
      setLibrary(selectedLibrary);
      setComfyStatus(comfy);
      setComfyEndpoint(comfy.endpoint);
      setVlmBackend(comfy.vlmBackend);
      setScriptTextModel(comfy.scriptTextModel);
      setTextModelProvider(comfy.textModelProvider);
      settingsLoaded.current = true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to open settings"
      );
    }
  }, []);

  useEffect(() => {
    const handleOpenCredentials = (event: Event) => {
      const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
      setCredentialPromptReason(reason === "comfy" ? reason : "generate");
      void openSettings();
      if (reason === "comfy") {
        void window.mago.comfy.check().then(setComfyStatus);
      }
    };
    window.addEventListener(OPEN_CREDENTIALS_EVENT, handleOpenCredentials);
    return () =>
      window.removeEventListener(OPEN_CREDENTIALS_EVENT, handleOpenCredentials);
  }, [openSettings]);

  useEffect(() => {
    const handlePreferencesChange = () =>
      setProviderPreferences(readProviderPreferences());
    window.addEventListener(
      PROVIDER_PREFERENCES_EVENT,
      handlePreferencesChange
    );
    return () =>
      window.removeEventListener(
        PROVIDER_PREFERENCES_EVENT,
        handlePreferencesChange
      );
  }, []);

  const chooseLibrary = useCallback(async () => {
    try {
      setError(null);
      const selected = await window.mago.library.choose();
      if (selected) setLibrary(selected);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to use folder"
      );
    }
  }, []);

  const saveComfyEndpoint = useCallback(async (): Promise<boolean> => {
    if (isComfyActionPending) return false;
    if (!settingsLoaded.current) {
      setOpen(false);
      return true;
    }
    endpointCheckId.current++;
    try {
      setError(null);
      setIsComfyActionPending(true);
      const status = await window.mago.comfy.save({
        endpoint: comfyEndpoint,
        vlmBackend,
        scriptTextModel,
        textModelProvider
      });
      setComfyEndpoint(status.endpoint);
      setVlmBackend(status.vlmBackend);
      setScriptTextModel(status.scriptTextModel);
      setTextModelProvider(status.textModelProvider);
      setComfyStatus(status);
      setOpen(false);
      // Optimize prompt reads where to run from this cache (useTextModelRoute).
      queryClient.setQueryData(queryKeys.comfySettings.all, {
        endpoint: status.endpoint,
        vlmBackend: status.vlmBackend,
        scriptTextModel: status.scriptTextModel,
        textModelProvider: status.textModelProvider
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings-vlm-status"] }),
        queryClient.invalidateQueries({
          queryKey: ["settings-script-text-status"]
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.vlmStatus.all })
      ]);
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save ComfyUI endpoint"
      );
      return false;
    } finally {
      setIsComfyActionPending(false);
    }
  }, [
    isComfyActionPending,
    comfyEndpoint,
    queryClient,
    scriptTextModel,
    textModelProvider,
    vlmBackend
  ]);

  const handleSignIn = useCallback(async () => {
    try {
      setError(null);
      setIsSignInPending(true);
      // Same rebuild the first-launch gate uses -- the window is recreated
      // with the new mode baked in, not the whole app restarted.
      await window.mago.account.chooseMode("cloud");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in");
      setIsSignInPending(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!window.confirm("Sign out of Mago cloud?")) return;
    await signOut();
    // Drops the stored mode entirely rather than switching to "offline" --
    // identity mode is baked into the window at boot (see identity.tsx), so
    // this takes the same rebuild the sign-in gate uses, and lands back on
    // that gate so there is still a way to sign back in afterwards.
    await window.mago.account.signOut();
  }, [signOut]);

  return (
    <>
      <AriaButton
        aria-label="Open local library settings"
        onPress={() => {
          setCredentialPromptReason(null);
          void openSettings();
        }}
        className="flex w-full min-w-0 items-center gap-2 h-10 px-3 rounded-lg cursor-pointer outline-hidden hover:bg-element-primary-active"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-element-primary text-glyph-primary">
          <Icon iconSet="24" iconName="render-settings" className="size-4" />
        </span>
        <Text
          component="span"
          variant="sm"
          color="glyph-secondary"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {isCloudAccountActive()
            ? t("titles.my_account.label")
            : t("titles.local_settings.label")}
        </Text>
      </AriaButton>
      <Modal
        open={open}
        onClose={() => void saveComfyEndpoint()}
        title="Local settings"
        width="sm"
        fullHeight
      >
        <div className="scrollbar-custom flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {isComfyActionPending && (
            <Text variant="xs" color="glyph-secondary">
              Saving settings...
            </Text>
          )}
          {isCloudAccountActive() && user && (
            <>
              <div className="flex flex-col gap-3">
                <Text variant="sm" weight="bold">
                  Account
                </Text>
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-element-primary text-glyph-primary uppercase">
                    {(user.emailAddresses[0]?.emailAddress ?? "?").charAt(0)}
                  </span>
                  <Text
                    variant="xs"
                    color="glyph-secondary"
                    className="break-all"
                  >
                    {user.emailAddresses[0]?.emailAddress ?? "Signed in"}
                  </Text>
                </div>
                <CloudAccountBillingActions
                  onNavigateAway={() => void saveComfyEndpoint()}
                />
                <div className="flex gap-2">
                  <GhostButton
                    colorScheme="color"
                    onPress={() => void handleSignOut()}
                  >
                    Sign out
                  </GhostButton>
                </div>
              </div>
              <div className="h-px bg-glyph-stroke" aria-hidden="true" />
            </>
          )}
          {!isCloudAccountActive() && (
            <>
              <div className="flex flex-col gap-2">
                <Text variant="sm" weight="bold">
                  Account
                </Text>
                <Text variant="xs" color="glyph-secondary">
                  Sign in to use cloud rendering, credits and your subscription.
                </Text>
                <div className="flex gap-2">
                  <GhostButton
                    loading={isSignInPending}
                    onPress={() => void handleSignIn()}
                  >
                    Sign in to Mago
                  </GhostButton>
                </div>
              </div>
              <div className="h-px bg-glyph-stroke" aria-hidden="true" />
            </>
          )}
          <div className="flex flex-col gap-1">
            <Text variant="sm" weight="bold">
              Project folder
            </Text>
            <Text variant="xs" color="glyph-secondary" className="break-all">
              {library?.rootPath ?? "No local library selected"}
            </Text>
          </div>
          {error && (
            <Text variant="xs" color="glyph-error">
              {error}
            </Text>
          )}
          <div className="flex gap-2">
            <GhostButton onPress={chooseLibrary}>
              {library ? "Change folder" : "Choose folder"}
            </GhostButton>
            {library && (
              <GhostButton onPress={() => window.mago.library.reveal()}>
                Show in folder
              </GhostButton>
            )}
          </div>
          <Text variant="2xs" color="glyph-tertiary">
            Mago stores its project database and generated thumbnails here.
            Source videos stay in their original locations.
          </Text>

          {providerPreferences["local-comfy"] && (
            <>
              <div className="h-px bg-glyph-stroke" aria-hidden="true" />

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Text variant="sm" weight="bold">
                    ComfyUI
                  </Text>
                  <Text variant="2xs" color="glyph-tertiary">
                    Qwen Image Edit, local Wan video renders and Qwen3-VL
                    captioning all run through this ComfyUI API. No API key is
                    required.
                  </Text>
                </div>
                {credentialPromptReason === "comfy" && (
                  <Text variant="xs" color="glyph-warning">
                    Set a responding ComfyUI endpoint before using local ComfyUI
                    models.
                  </Text>
                )}
                <label className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <SettingsStatusMark
                      ready={connectionReady}
                      label="API endpoint"
                    />
                    <Text component="span" variant="xs" color="glyph-secondary">
                      API endpoint
                    </Text>
                  </span>
                  <Input
                    aria-label="ComfyUI API endpoint"
                    autoComplete="off"
                    value={comfyEndpoint}
                    onBlur={() => void validateEndpoint()}
                    onChange={(event) => {
                      endpointCheckId.current++;
                      setCheckingEndpoint(false);
                      setComfyEndpoint(event.target.value);
                    }}
                  />
                  {connectionReady === false && (
                    <Text variant="xs" color="glyph-error">
                      {connectionHint}
                    </Text>
                  )}
                </label>
                {isSavedComfyEndpointUnavailable && (
                  <LaunchComfyOrSetupMagoStudioButton
                    onSetup={() => void saveComfyEndpoint()}
                    onBeforeOpenComfyLaunch={saveComfyEndpoint}
                  />
                )}
                <label className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <SettingsStatusMark
                      ready={providerReady}
                      label="Text model"
                    />
                    <Text component="span" variant="xs" color="glyph-secondary">
                      Text model
                    </Text>
                  </span>
                  <select
                    aria-label="Text model"
                    className="h-8 rounded border border-element-primary bg-element-primary px-2 text-sm text-glyph-secondary outline-hidden focus-visible:outline-1 focus-visible:outline-glyph-action-main"
                    value={usesCloudText ? "cloud" : scriptTextModel}
                    onChange={(event) => {
                      const value = event.target.value;
                      setTextModelProvider(
                        value === "cloud" ? "cloud" : "local"
                      );
                      if (value !== "cloud")
                        setScriptTextModel(value as LocalScriptTextModel);
                    }}
                  >
                    <option
                      value="cloud"
                      disabled={
                        !isCloudAccountActive() ||
                        !providerPreferences["mago-cloud"]
                      }
                    >
                      Gemini (Mago cloud)
                    </option>
                    <option value="qwen38-27b-q3">
                      Qwen3.8 27B Q3 (local, lower memory)
                    </option>
                    <option value="qwen38-27b-q5">
                      Qwen3.8 27B Q5 (local, higher quality)
                    </option>
                  </select>
                  {providerReady === false && (
                    <Text variant="xs" color="glyph-error">
                      {providerHint}
                    </Text>
                  )}
                </label>
              </div>
            </>
          )}
          <LocalSetupDebugSetting />
          <LocalAppVersion />
        </div>
      </Modal>
    </>
  );
}
