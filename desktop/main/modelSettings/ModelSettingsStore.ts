import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import type {
  EndpointModelSettings,
  ModelOperationResult
} from "../../shared/modelSettings";

export interface CachedModelHost {
  lastSeenAt: string;
  version: string | null;
  pythonVersion: string | null;
  root: string | null;
  categories: Record<string, string[]>;
  files: Record<string, string[]>;
  devices: unknown[];
}
interface StoredModelEndpoint {
  settings?: EndpointModelSettings;
  host?: CachedModelHost;
  hashes?: Record<string, { size: number; modified: number; sha256: string }>;
  problems?: Record<string, ModelOperationResult>;
  runtime?: Record<string, unknown>;
}
interface ModelSettingsDocument {
  endpoints: Record<string, StoredModelEndpoint>;
}

const fileOperations = new Map<string, Promise<void>>();
const RENAME_ATTEMPTS = 6;
const RENAME_RETRY_DELAY_MS = 50;

const replaceSettingsFile = async (temporary: string, destination: string) => {
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(temporary, destination);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (
        process.platform !== "win32" ||
        !["EPERM", "EACCES", "EBUSY"].includes(code ?? "") ||
        attempt >= RENAME_ATTEMPTS - 1
      )
        throw error;
      // Antivirus/indexers can briefly hold the destination open on Windows.
      // Keep the previous file intact until the atomic replacement succeeds.
      await delay(RENAME_RETRY_DELAY_MS * (attempt + 1));
    }
  }
};

export class ModelSettingsStore {
  constructor(private readonly filename: string) {}

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const absolute = path.resolve(this.filename);
    const key =
      process.platform === "win32" ? absolute.toLowerCase() : absolute;
    const result = (fileOperations.get(key) ?? Promise.resolve()).then(
      operation
    );
    const settled = result.then(
      () => {},
      () => {}
    );
    fileOperations.set(key, settled);
    void settled.then(() => {
      if (fileOperations.get(key) === settled) fileOperations.delete(key);
    });
    return result;
  }

  async endpoint(endpoint: string): Promise<StoredModelEndpoint> {
    return this.enqueue(
      async () => (await this.read()).endpoints[endpoint] ?? {}
    );
  }

  update(
    endpoint: string,
    update: (current: StoredModelEndpoint) => StoredModelEndpoint
  ): Promise<void> {
    return this.enqueue(async () => {
      const stored = await this.read();
      stored.endpoints[endpoint] = update(stored.endpoints[endpoint] ?? {});
      await mkdir(path.dirname(this.filename), { recursive: true });
      const temporary = `${this.filename}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify(stored, null, 2), {
          mode: 0o600
        });
        await replaceSettingsFile(temporary, this.filename);
      } finally {
        await unlink(temporary).catch(() => undefined);
      }
    });
  }

  recordProblem(
    endpoint: string,
    model: string,
    result: ModelOperationResult
  ): Promise<void> {
    return this.update(endpoint, (current) => {
      const lastRecorded = Math.max(
        0,
        ...Object.values(current.problems ?? {}).map(
          (problem) => Date.parse(String(problem.details?.recordedAt)) || 0
        )
      );
      return {
        ...current,
        problems: {
          ...current.problems,
          [model]: {
            ...result,
            details: {
              ...result.details,
              recordedAt: new Date(
                Math.max(Date.now(), lastRecorded + 1)
              ).toISOString()
            }
          }
        }
      };
    });
  }

  private async read(): Promise<ModelSettingsDocument> {
    try {
      const value: unknown = JSON.parse(await readFile(this.filename, "utf8"));
      if (
        !value ||
        typeof value !== "object" ||
        !("endpoints" in value) ||
        !value.endpoints ||
        typeof value.endpoints !== "object" ||
        Array.isArray(value.endpoints)
      )
        throw new Error("Invalid model settings document");
      return value as ModelSettingsDocument;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      )
        return { endpoints: {} };
      throw error;
    }
  }
}
