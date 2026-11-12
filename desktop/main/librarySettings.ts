import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  access,
  copyFile,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile
} from "node:fs/promises";
import path from "node:path";

import { app } from "electron";

import {
  LOCAL_SCRIPT_TEXT_MODELS,
  type LocalScriptTextModel,
  type LocalTextModelProvider,
  type LocalVlmBackend
} from "../shared/contracts";
import {
  findLocalModelGroup,
  isLocalModelGroupId,
  resolveSelectedHardwareVariant,
  SCRIPT_TEXT_MODEL_GROUP_ID,
  type LocalModelGroupId,
  type LocalModelGroupVariantId,
  type SelectedModelGroupVariants
} from "../shared/localModelGroups";
import { LOCAL_MODEL_LICENSES } from "../shared/localModelLicenses";
import {
  LOCAL_MODEL_BUNDLES,
  requiredBundles
} from "../shared/localModelManifest";

import { normalizeComfyEndpoint } from "./comfy/normalizeComfyEndpoint";
import { detectPriorSetup } from "./localSetup/detectPriorSetup";
import { ModelSettingsStore } from "./modelSettings/ModelSettingsStore";
import { resolveAppFolder } from "./resolveAppFolder";

interface StoredSettings {
  libraryRoot?: string;
  comfyEndpoint?: string;
  vlmBackend?: LocalVlmBackend;
  scriptTextModel?: LocalScriptTextModel;
  selectedModelGroupVariants?: SelectedModelGroupVariants;
  textModelProvider?: LocalTextModelProvider;
  appMode?: "cloud" | "offline";
  localModelsRoot?: string;
  localSetupCompleted?: boolean;
  inferredComfyInstall?: { endpoint: string; directory: string };
  selectedModelBundleIds?: string[];
  acceptedModelLicenseRepos?: string[];
  installedModelGroups?: Partial<Record<LocalModelGroupId, string[]>>;
}

const DEFAULT_COMFY_ENDPOINT = "http://127.0.0.1:8188";
const DEFAULT_VLM_BACKEND: LocalVlmBackend = "qwen3-vl-4b-heretic-int8";
// Cloud by default: Optimize prompt ran on Mago cloud before the local adapter
// existed, and it needs no 15 GB model download. Signed out, it resolves to
// local anyway (resolveTextModelRoute).
const DEFAULT_TEXT_MODEL_PROVIDER: LocalTextModelProvider = "cloud";

const isLocalScriptTextModel = (
  value: unknown
): value is LocalScriptTextModel =>
  typeof value === "string" &&
  (LOCAL_SCRIPT_TEXT_MODELS as readonly string[]).includes(value);

export class CorruptLibrarySettingsError extends Error {
  constructor(settingsPath: string, cause: unknown) {
    super(`The Mago settings file is damaged: ${settingsPath}`, { cause });
    this.name = "CorruptLibrarySettingsError";
  }
}

export class LibrarySettings {
  private setupBackfill: Promise<boolean> | null = null;
  private previousSettingsWrite: Promise<void> = Promise.resolve();
  getDefaultLibraryRoot(): string {
    return resolveAppFolder(app.getPath("userData"));
  }

  async getLibraryRoot(): Promise<string> {
    const configuredRoot = (await this.readSettings()).libraryRoot;
    return configuredRoot
      ? path.resolve(configuredRoot)
      : this.getDefaultLibraryRoot();
  }

  async setLibraryRoot(libraryRoot: string): Promise<void> {
    await this.updateSettings({ libraryRoot: path.resolve(libraryRoot) });
  }

  /** Null until the user has answered the sign-in gate. */
  async getAppMode(): Promise<"cloud" | "offline" | null> {
    const mode = (await this.readSettings()).appMode;
    return mode === "cloud" || mode === "offline" ? mode : null;
  }

  async setAppMode(appMode: "cloud" | "offline"): Promise<void> {
    await this.updateSettings({ appMode });
  }

  /** Back to "unchosen": the next launch shows the sign-in gate again. */
  async clearAppMode(): Promise<void> {
    await this.updateSettings({ appMode: undefined });
  }

  /** Null until the setup wizard has been given a folder for the engine. */
  async getLocalModelsRoot(): Promise<string | null> {
    const configuredRoot = (await this.readSettings()).localModelsRoot;
    return configuredRoot ? path.resolve(configuredRoot) : null;
  }

  async hasCompletedLocalSetup(): Promise<boolean> {
    const settings = await this.readSettings();
    if (typeof settings.localSetupCompleted === "boolean")
      return settings.localSetupCompleted;
    if (!this.setupBackfill) {
      this.setupBackfill = (async () => {
        const detected = await detectPriorSetup(settings);
        const current = await this.readSettings();
        // A setup may finish while the migration is checking an old endpoint.
        if (typeof current.localSetupCompleted === "boolean")
          return current.localSetupCompleted;
        await this.updateSettings({ localSetupCompleted: detected });
        return detected;
      })().finally(() => {
        this.setupBackfill = null;
      });
    }
    return this.setupBackfill;
  }

  async markLocalSetupCompleted(): Promise<void> {
    await this.updateSettings({ localSetupCompleted: true });
  }

  async getAcceptedModelLicenseRepos(): Promise<string[]> {
    const stored = (await this.readSettings()).acceptedModelLicenseRepos;
    return Array.isArray(stored)
      ? stored.filter((repo) => typeof repo === "string")
      : [];
  }

  async acceptModelLicenses(huggingFaceRepos: string[]): Promise<void> {
    const known = new Set(
      LOCAL_MODEL_LICENSES.map((license) => license.huggingFaceRepo)
    );
    const accepted = new Set(await this.getAcceptedModelLicenseRepos());
    for (const repo of huggingFaceRepos)
      if (known.has(repo)) accepted.add(repo);
    await this.updateSettings({ acceptedModelLicenseRepos: [...accepted] });
  }

  async getInstalledModelGroups(): Promise<
    Partial<Record<LocalModelGroupId, string[]>>
  > {
    return this.readValidInstalledModelGroups(await this.readSettings());
  }

  recordInstalledModelGroup(
    groupId: LocalModelGroupId,
    installedItemSha256s: string[]
  ): Promise<void> {
    return this.runSettingsWriteInOrder(async () => {
      const settings = await this.readSettings();
      await this.writeSettings({
        ...settings,
        installedModelGroups: {
          ...this.readValidInstalledModelGroups(settings),
          [groupId]: [...new Set(installedItemSha256s)]
        }
      });
    });
  }

  private readValidInstalledModelGroups(
    settings: StoredSettings
  ): Partial<Record<LocalModelGroupId, string[]>> {
    const stored: unknown = settings.installedModelGroups;
    if (!stored || typeof stored !== "object" || Array.isArray(stored))
      return {};
    return Object.fromEntries(
      Object.entries(stored).filter(
        ([groupId, installedItemSha256s]) =>
          isLocalModelGroupId(groupId) &&
          Array.isArray(installedItemSha256s) &&
          installedItemSha256s.every((sha256) => typeof sha256 === "string")
      )
    );
  }

  async setLocalModelsRoot(localModelsRoot: string): Promise<void> {
    await this.updateSettings({
      localModelsRoot: path.resolve(localModelsRoot)
    });
  }

  async getInferredComfyInstall(): Promise<{
    endpoint: string;
    directory: string;
  } | null> {
    return (await this.readSettings()).inferredComfyInstall ?? null;
  }

  async setInferredComfyInstall(
    endpoint: string,
    directory: string
  ): Promise<void> {
    await this.updateSettings({
      inferredComfyInstall: { endpoint, directory }
    });
  }

  /**
   * Which bundles the user asked for. Needed because an absent file cannot say
   * whether an optional bundle was declined or has simply not arrived yet.
   */
  async getSelectedModelBundleIds(): Promise<string[]> {
    const stored = (await this.readSettings()).selectedModelBundleIds;
    const known = new Set(LOCAL_MODEL_BUNDLES.map((bundle) => bundle.id));
    if (!Array.isArray(stored)) {
      return requiredBundles(LOCAL_MODEL_BUNDLES).map((bundle) => bundle.id);
    }
    return stored.filter((id) => known.has(id));
  }

  async setSelectedModelBundleIds(bundleIds: string[]): Promise<void> {
    const known = new Set(LOCAL_MODEL_BUNDLES.map((bundle) => bundle.id));
    await this.updateSettings({
      selectedModelBundleIds: bundleIds.filter((id) => known.has(id))
    });
  }

  async getComfyEndpoint(): Promise<string> {
    return (await this.readSettings()).comfyEndpoint ?? DEFAULT_COMFY_ENDPOINT;
  }

  async setComfyEndpoint(endpoint: string): Promise<void> {
    await this.updateSettings({ comfyEndpoint: endpoint });
  }

  async getVlmBackend(): Promise<LocalVlmBackend> {
    const backend = (await this.readSettings()).vlmBackend;
    return backend === "qwen3-vl-4b-heretic-int8"
      ? backend
      : DEFAULT_VLM_BACKEND;
  }

  async setVlmBackend(vlmBackend: LocalVlmBackend): Promise<void> {
    await this.updateSettings({ vlmBackend });
  }

  async getScriptTextModel(): Promise<LocalScriptTextModel> {
    return (
      (await this.getScriptTextVariantOverride()) ??
      this.getSetupScriptTextModel()
    );
  }

  async getScriptTextVariantOverride(): Promise<LocalScriptTextModel | null> {
    const modelSettings = await new ModelSettingsStore(
      path.join(app.getPath("userData"), "model-settings.json")
    ).endpoint(normalizeComfyEndpoint(await this.getComfyEndpoint()));
    const variant = modelSettings.settings?.models.text?.variant;
    return isLocalScriptTextModel(variant) ? variant : null;
  }

  async getSetupScriptTextModel(): Promise<LocalScriptTextModel> {
    const localLlmVariant = resolveSelectedHardwareVariant(
      findLocalModelGroup(SCRIPT_TEXT_MODEL_GROUP_ID),
      await this.getSelectedModelGroupVariants()
    );
    const scriptTextModel = localLlmVariant?.id;
    if (!isLocalScriptTextModel(scriptTextModel))
      throw new Error(`Not a script text model: ${scriptTextModel}`);
    return scriptTextModel;
  }

  setScriptTextModel(scriptTextModel: LocalScriptTextModel): Promise<void> {
    return this.setSelectedModelGroupVariant(
      SCRIPT_TEXT_MODEL_GROUP_ID,
      scriptTextModel
    );
  }

  async getSelectedModelGroupVariants(): Promise<SelectedModelGroupVariants> {
    return this.readValidSelectedModelGroupVariants(await this.readSettings());
  }

  setSelectedModelGroupVariant(
    groupId: LocalModelGroupId,
    variantId: LocalModelGroupVariantId
  ): Promise<void> {
    return this.runSettingsWriteInOrder(async () => {
      const settings = await this.readSettings();
      await this.writeSettings({
        ...settings,
        scriptTextModel: undefined,
        selectedModelGroupVariants: {
          ...this.readValidSelectedModelGroupVariants(settings),
          [groupId]: variantId
        }
      });
    });
  }

  private readValidSelectedModelGroupVariants(
    settings: StoredSettings
  ): SelectedModelGroupVariants {
    const legacyScriptTextModelSelection: SelectedModelGroupVariants =
      isLocalScriptTextModel(settings.scriptTextModel)
        ? { [SCRIPT_TEXT_MODEL_GROUP_ID]: settings.scriptTextModel }
        : {};
    const stored: unknown = settings.selectedModelGroupVariants;
    if (!stored || typeof stored !== "object" || Array.isArray(stored))
      return legacyScriptTextModelSelection;
    const validStoredSelection: SelectedModelGroupVariants = Object.fromEntries(
      Object.entries(stored).filter(
        ([groupId, variantId]) =>
          isLocalModelGroupId(groupId) &&
          findLocalModelGroup(groupId).hardwareVariants?.some(
            (variant) => variant.id === variantId
          )
      )
    );
    return { ...legacyScriptTextModelSelection, ...validStoredSelection };
  }

  async getTextModelProvider(): Promise<LocalTextModelProvider> {
    const provider = (await this.readSettings()).textModelProvider;
    return provider === "local" ? provider : DEFAULT_TEXT_MODEL_PROVIDER;
  }

  async setTextModelProvider(
    textModelProvider: LocalTextModelProvider
  ): Promise<void> {
    await this.updateSettings({ textModelProvider });
  }

  async assertWritable(libraryRoot: string): Promise<void> {
    await mkdir(libraryRoot, { recursive: true });
    await access(libraryRoot, constants.R_OK | constants.W_OK);
  }

  async recoverCorruptSettings(libraryRoot: string): Promise<string | null> {
    try {
      await this.readSettings();
    } catch (error) {
      if (!(error instanceof CorruptLibrarySettingsError)) throw error;
      const settingsPath = this.getSettingsPath();
      const backupPath = `${settingsPath}.corrupt-${randomUUID()}.bak`;
      await copyFile(settingsPath, backupPath, constants.COPYFILE_EXCL);
      await this.runSettingsWriteInOrder(() =>
        this.writeSettings({ libraryRoot: path.resolve(libraryRoot) })
      );
      return backupPath;
    }
    // Respect settings repaired externally while the recovery dialog was open.
    await this.setLibraryRoot(libraryRoot);
    return null;
  }

  private getSettingsPath(): string {
    return path.join(app.getPath("userData"), "settings.json");
  }

  private async readSettings(): Promise<StoredSettings> {
    try {
      const settings: unknown = JSON.parse(
        await readFile(this.getSettingsPath(), "utf8")
      );
      if (
        !settings ||
        typeof settings !== "object" ||
        Array.isArray(settings)
      ) {
        throw new SyntaxError("Settings must contain a JSON object");
      }
      return settings as StoredSettings;
    } catch (error) {
      if (this.isMissingFileError(error)) return {};
      if (error instanceof SyntaxError) {
        throw new CorruptLibrarySettingsError(this.getSettingsPath(), error);
      }
      throw error;
    }
  }

  private updateSettings(update: Partial<StoredSettings>): Promise<void> {
    return this.runSettingsWriteInOrder(async () => {
      const settings = { ...(await this.readSettings()), ...update };
      await this.writeSettings(settings);
    });
  }

  private runSettingsWriteInOrder(write: () => Promise<void>): Promise<void> {
    const queuedWrite = this.previousSettingsWrite.then(write);
    this.previousSettingsWrite = queuedWrite.catch(() => {});
    return queuedWrite;
  }

  private async writeSettings(settings: StoredSettings): Promise<void> {
    const settingsPath = this.getSettingsPath();
    await mkdir(path.dirname(settingsPath), { recursive: true });
    const temporaryPath = `${settingsPath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
        flush: true
      });
      await rename(temporaryPath, settingsPath);
    } finally {
      await unlink(temporaryPath).catch(() => {});
    }
  }

  private isMissingFileError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    );
  }
}
