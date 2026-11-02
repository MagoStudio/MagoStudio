import { ipcMain } from "electron";

import {
  IPC_CHANNELS,
  type LocalScriptChatMessageInput,
  type LocalScriptProjectSnapshotInput
} from "../../shared/contracts";
import { DatabaseManager } from "../database/databaseManager";
import { ScriptProjectSnapshotRepository } from "../database/scriptProjectSnapshotRepository";
import { LibrarySettings } from "../librarySettings";
import { LocalScriptChatService } from "../scriptProjects/localScriptChatService";
import { LocalScriptProjectService } from "../scriptProjects/localScriptProjectService";

import { requireTrustedSender } from "./trustedSender";

const requireString = (value: unknown, name: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
};

const optionalRecord = (
  value: unknown,
  name: string
): Record<string, unknown> | undefined => {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
};

const optionalNumber = (value: unknown, name: string): number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`${name} must be a number`);
  return value;
};

/** The cloud route's request checks. */
const chatMessageInput = (value: unknown): LocalScriptChatMessageInput => {
  const input = optionalRecord(value, "chat message input");
  if (!input) throw new Error("chat message input must be an object");
  const tools = input.tools;
  if (
    tools !== undefined &&
    tools !== null &&
    !(
      Array.isArray(tools) &&
      tools.every((tool) => tool && typeof tool === "object")
    )
  )
    throw new Error("tools must be a list of tool objects");
  if (typeof input.message !== "string") throw new Error("message is required");
  return {
    projectId: requireString(input.projectId, "projectId"),
    message: input.message,
    systemPrompt:
      typeof input.systemPrompt === "string" ? input.systemPrompt : undefined,
    tools: Array.isArray(tools) ? tools : undefined,
    historyMessages: optionalNumber(input.historyMessages, "historyMessages")
  };
};

export const registerScriptProjectHandlers = ({
  repository,
  service,
  chat,
  databaseManager,
  settings
}: {
  repository: ScriptProjectSnapshotRepository;
  service: LocalScriptProjectService;
  chat: LocalScriptChatService;
  databaseManager: DatabaseManager;
  settings: LibrarySettings;
}): void => {
  const ensureDatabase = async (): Promise<void> => {
    if (databaseManager.isOpen()) return;
    await databaseManager.open(await settings.getLibraryRoot());
  };

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsCacheMedia,
    async (event, projectId: unknown, sourceUrl: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      await repository.cacheScheduledMedia(
        requireString(projectId, "projectId"),
        requireString(sourceUrl, "sourceUrl")
      );
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsCancelMedia,
    (event, projectId: unknown, sourceUrl: unknown) => {
      requireTrustedSender(event);
      repository.cancelScheduledMedia(
        requireString(projectId, "projectId"),
        requireString(sourceUrl, "sourceUrl")
      );
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsPut,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("script project snapshot must be an object");
      }
      const input = value as Record<string, unknown>;
      await repository.put({
        projectId: requireString(input.projectId, "projectId"),
        metadataOnly: input.metadataOnly === true,
        project: optionalRecord(input.project, "project"),
        state: optionalRecord(input.state, "state"),
        scriptVersions: optionalRecord(input.scriptVersions, "scriptVersions"),
        planDetails: optionalRecord(input.planDetails, "planDetails") as
          | Record<string, Record<string, unknown>>
          | undefined,
        cut: optionalRecord(input.cut, "cut")
      } satisfies LocalScriptProjectSnapshotInput);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsGet,
    async (event, projectId: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      return service.getSnapshot(requireString(projectId, "projectId"));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsGetPlan,
    async (event, planId: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      return service.getPlan(requireString(planId, "planId"));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsCancelPlan,
    async (event, planId: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      return service.cancelPlan(requireString(planId, "planId"));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsResumePlan,
    async (event, planId: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      return service.resumePlan(requireString(planId, "planId"));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsCast,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("local script casting input must be an object");
      return service.cast(
        value as Parameters<LocalScriptProjectService["cast"]>[0]
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsFindMedia,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      const query = optionalRecord(value, "media query");
      if (!query) throw new Error("media query must be an object");
      const optionalId = (member: unknown, name: string) =>
        member === undefined ? undefined : requireString(member, name);
      return service.findMedia({
        assetId: optionalId(query.assetId, "assetId"),
        clipId: optionalId(query.clipId, "clipId")
      });
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsGetRenderMetrics,
    async (event, assetId: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      return service.getRenderMetrics(requireString(assetId, "assetId"));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsChatMessage,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      return chat.post(chatMessageInput(value));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsChatMessages,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      const input = optionalRecord(value, "chat messages input");
      if (!input) throw new Error("chat messages input must be an object");
      return chat.list(
        requireString(input.projectId, "projectId"),
        optionalNumber(input.limit, "limit")
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsGenerateSheets,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("local sheet generation input must be an object");
      return service.generateSheets(
        value as Parameters<LocalScriptProjectService["generateSheets"]>[0]
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsGenerateShots,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("local shot generation input must be an object");
      return service.generateShots(
        value as Parameters<LocalScriptProjectService["generateShots"]>[0]
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsExportCut,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("local cut export input must be an object");
      return service.exportCut(
        value as Parameters<LocalScriptProjectService["exportCut"]>[0]
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.scriptProjectsUpdate,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase();
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("local script update input must be an object");
      return service.update(
        value as Parameters<LocalScriptProjectService["update"]>[0]
      );
    }
  );
};
