"use client";

import { useComfyLaunchStatus } from "@app/components/LaunchComfyButton/hooks/useComfyLaunchStatus";
import { Icon } from "@components/Icon";
import { Modal } from "@components/Modal";
import { TabMenuRegular } from "@components/TabMenuRegular";
import { Text } from "@components/Text";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { TabPanel, Tabs } from "react-aria-components/Tabs";
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

import { LocalAppVersion } from "./LocalAppVersion";
import { LocalSettingsAccountTab } from "./LocalSettings/LocalSettingsAccountTab";
import { LocalSettingsAttentionDot } from "./LocalSettings/LocalSettingsAttentionDot";
import { LocalSettingsGeneralTab } from "./LocalSettings/LocalSettingsGeneralTab";
import { LocalSettingsModelsTab } from "./LocalSettings/LocalSettingsModelsTab";
import {
  LOCAL_SETTINGS_TAB_IDS,
  LocalSettingsTabId
} from "./LocalSettings/localSettingsTabIds";

const DEFAULT_COMFY_ENDPOINT = "http://127.0.0.1:8188";
const DEFAULT_VLM_BACKEND: LocalVlmBackend = "qwen3-vl-4b-heretic-int8";
const DEFAULT_SCRIPT_TEXT_MODEL: LocalScriptTextModel = "qwen38-27b-q5";
const DEFAULT_TEXT_MODEL_PROVIDER: LocalTextModelProvider = "cloud";

const LOCAL_SETTINGS_TAB_PANEL_CLASS_NAME =
  "scrollbar-custom flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 outline-hidden";

export function UserMenu() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<LibraryInfo | null>(null);
  const [selectedSettingsTabId, setSelectedSettingsTabId] =
    useState<LocalSettingsTabId>(LOCAL_SETTINGS_TAB_IDS.account);
  const [settingsLoadError, setSettingsLoadError] = useState<string | null>(
    null
  );
  const [signInError, setSignInError] = useState<string | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(
    null
  );
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
            error instanceof Error
              ? error.message
              : t("localSettings.errors.checkComfy")
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
    ? t("localSettings.hints.endpointUnchecked")
    : (comfyStatus?.message ?? t("localSettings.hints.comfyNotResponding"));
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
      ? t("localSettings.hints.connectComfyFirst")
      : (textCheck.error?.message ??
        (missingText
          ? t("localSettings.hints.textModelMissing", { missing: missingText })
          : t("localSettings.hints.textModelUnverified")));
  const usesCloudText =
    textModelProvider === "cloud" && providerPreferences["mago-cloud"];
  const providerReady = usesCloudText ? isCloudAccountActive() : scriptReady;
  const providerHint = usesCloudText
    ? t("localSettings.hints.cloudTextNeedsSignIn")
    : scriptHint;
  const isLocalTextModelMissingFromRespondingComfy =
    !usesCloudText && connectionReady === true && Boolean(missingText);
  const isModelsTabSelected =
    selectedSettingsTabId === LOCAL_SETTINGS_TAB_IDS.models;
  const showsModelsTabAttention =
    !isModelsTabSelected && isLocalTextModelMissingFromRespondingComfy;

  const openSettings = useCallback(async () => {
    settingsLoaded.current = false;
    setOpen(true);
    setSettingsLoadError(null);
    setSignInError(null);
    setLibraryError(null);
    setSettingsSaveError(null);
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
      setSettingsLoadError(
        caught instanceof Error
          ? caught.message
          : t("localSettings.errors.openSettings")
      );
    }
  }, [t]);

  useEffect(() => {
    const handleOpenCredentials = (event: Event) => {
      const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
      setCredentialPromptReason(reason === "comfy" ? reason : "generate");
      setSelectedSettingsTabId(
        reason === "comfy"
          ? LOCAL_SETTINGS_TAB_IDS.models
          : LOCAL_SETTINGS_TAB_IDS.account
      );
      void openSettings();
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
      setLibraryError(null);
      const selected = await window.mago.library.choose();
      if (selected) setLibrary(selected);
    } catch (caught) {
      setLibraryError(
        caught instanceof Error
          ? caught.message
          : t("localSettings.errors.useFolder")
      );
    }
  }, [t]);

  const saveComfyEndpoint = useCallback(async (): Promise<boolean> => {
    if (isComfyActionPending) return false;
    if (!settingsLoaded.current) {
      setOpen(false);
      return true;
    }
    endpointCheckId.current++;
    try {
      setSettingsSaveError(null);
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
      setSettingsSaveError(
        caught instanceof Error
          ? caught.message
          : t("localSettings.errors.saveComfyEndpoint")
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
    t,
    textModelProvider,
    vlmBackend
  ]);

  const handleSignIn = useCallback(async () => {
    try {
      setSignInError(null);
      setIsSignInPending(true);
      // Same rebuild the first-launch gate uses -- the window is recreated
      // with the new mode baked in, not the whole app restarted.
      await window.mago.account.chooseMode("cloud");
    } catch (caught) {
      setSignInError(
        caught instanceof Error
          ? caught.message
          : t("localSettings.errors.signIn")
      );
      setIsSignInPending(false);
    }
  }, [t]);

  const handleSignOut = useCallback(async () => {
    if (!window.confirm(t("localSettings.signOutConfirm"))) return;
    await signOut();
    // Drops the stored mode entirely rather than switching to "offline" --
    // identity mode is baked into the window at boot (see identity.tsx), so
    // this takes the same rebuild the sign-in gate uses, and lands back on
    // that gate so there is still a way to sign back in afterwards.
    await window.mago.account.signOut();
  }, [signOut, t]);

  return (
    <>
      <AriaButton
        aria-label={t("localSettings.openButtonAriaLabel")}
        onPress={() => {
          setCredentialPromptReason(null);
          setSelectedSettingsTabId(LOCAL_SETTINGS_TAB_IDS.account);
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
        title={t("localSettings.title")}
        width="sm"
        fullHeight
      >
        <Tabs
          selectedKey={selectedSettingsTabId}
          onSelectionChange={(key) =>
            setSelectedSettingsTabId(String(key) as LocalSettingsTabId)
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabMenuRegular
            className="mb-4 gap-4 border-b border-element-primary"
            tabs={[
              {
                id: LOCAL_SETTINGS_TAB_IDS.account,
                name: t("localSettings.tabs.account")
              },
              {
                id: LOCAL_SETTINGS_TAB_IDS.models,
                name: t("localSettings.tabs.models"),
                badge: showsModelsTabAttention && <LocalSettingsAttentionDot />
              },
              {
                id: LOCAL_SETTINGS_TAB_IDS.general,
                name: t("localSettings.tabs.general")
              }
            ]}
          />
          {settingsLoadError && (
            <Text variant="xs" color="glyph-error" className="mb-3">
              {settingsLoadError}
            </Text>
          )}
          <TabPanel
            id={LOCAL_SETTINGS_TAB_IDS.account}
            className={LOCAL_SETTINGS_TAB_PANEL_CLASS_NAME}
          >
            <LocalSettingsAccountTab
              isCloudAccountActive={isCloudAccountActive()}
              signedInEmailAddress={user?.emailAddresses[0]?.emailAddress}
              isSignInPending={isSignInPending}
              signInError={signInError}
              onSignIn={() => void handleSignIn()}
              onSignOut={() => void handleSignOut()}
              onNavigateAway={() => void saveComfyEndpoint()}
            />
          </TabPanel>
          <TabPanel
            id={LOCAL_SETTINGS_TAB_IDS.models}
            className={LOCAL_SETTINGS_TAB_PANEL_CLASS_NAME}
          >
            <LocalSettingsModelsTab
              isOpenedBecauseComfyIsNeeded={credentialPromptReason === "comfy"}
              comfyEndpoint={comfyEndpoint}
              onComfyEndpointChange={(endpoint) => {
                endpointCheckId.current++;
                setCheckingEndpoint(false);
                setComfyEndpoint(endpoint);
              }}
              onComfyEndpointBlur={() => void validateEndpoint()}
              comfyConnectionReady={connectionReady}
              comfyConnectionHint={connectionHint}
              isSavedComfyEndpointUnavailable={isSavedComfyEndpointUnavailable}
              onSetupMagoStudio={() => void saveComfyEndpoint()}
              onBeforeOpenComfyLaunch={saveComfyEndpoint}
              selectedTextModel={usesCloudText ? "cloud" : scriptTextModel}
              isCloudTextModelDisabled={
                !isCloudAccountActive() || !providerPreferences["mago-cloud"]
              }
              onTextModelChange={(textModel) => {
                setTextModelProvider(textModel === "cloud" ? "cloud" : "local");
                if (textModel !== "cloud") setScriptTextModel(textModel);
              }}
              textModelReady={providerReady}
              textModelHint={providerHint}
            />
          </TabPanel>
          <TabPanel
            id={LOCAL_SETTINGS_TAB_IDS.general}
            className={LOCAL_SETTINGS_TAB_PANEL_CLASS_NAME}
          >
            <LocalSettingsGeneralTab
              library={library}
              libraryError={libraryError}
              onChooseLibrary={() => void chooseLibrary()}
              onRevealLibrary={() => void window.mago.library.reveal()}
            />
          </TabPanel>
        </Tabs>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-glyph-stroke pt-3">
          <LocalAppVersion />
          {isComfyActionPending && (
            <Text variant="xs" color="glyph-secondary">
              {t("localSettings.saving")}
            </Text>
          )}
          {settingsSaveError && !isComfyActionPending && (
            <Text variant="xs" color="glyph-error">
              {settingsSaveError}
            </Text>
          )}
        </div>
      </Modal>
    </>
  );
}
