"use client";

import { useUser } from "@clerk/react";
import { createJSONStorage } from "jotai/utils";
import { z } from "zod";

import { buildPrefixedStorageKey } from "./utils/buildPrefixedStorageKey";
import { createScopedStorageAtomCache } from "./utils/createScopedStorageAtomCache";

const globalStateSchema = z.object({
  isSettingsEditorOpen: z.boolean(),
  expandedFolderIds: z.array(z.string()).optional().default([]),
  projectSortBy: z
    .enum(["alphabetical", "lastEdited"])
    .optional()
    .default("lastEdited"),
  projectSortDirection: z.enum(["asc", "desc"]).optional().default("desc")
});

export type GlobalState = z.infer<typeof globalStateSchema>;

const DEFAULT_GLOBAL_STATE: GlobalState = {
  isSettingsEditorOpen: true,
  expandedFolderIds: [],
  projectSortBy: "lastEdited",
  projectSortDirection: "desc"
};

const GLOBAL_STORAGE_KEY_PREFIX = "storage";

const jsonStorage = createJSONStorage<GlobalState>(() => localStorage);
const validatingStorage: typeof jsonStorage = {
  ...jsonStorage,
  getItem: (key, initialValue) => {
    const parsed = globalStateSchema.safeParse(
      jsonStorage.getItem(key, initialValue)
    );
    return parsed.success ? parsed.data : DEFAULT_GLOBAL_STATE;
  }
};

const getGlobalStorageAtom = createScopedStorageAtomCache<GlobalState>({
  defaultValue: DEFAULT_GLOBAL_STATE,
  storage: validatingStorage,
  options: { getOnInit: true }
});

export function useGlobalStorageAtom() {
  const { user } = useUser();

  return getGlobalStorageAtom(
    buildPrefixedStorageKey(GLOBAL_STORAGE_KEY_PREFIX, {
      level: "user",
      userId: user?.id
    })
  );
}
