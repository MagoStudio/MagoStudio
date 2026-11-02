import { atomWithStorage } from "jotai/utils";

import { createInMemoryStorage, JotaiStorage } from "./createInMemoryStorage";
import { UNRESOLVED_SCOPE_KEY_PREFIX } from "./storageScope";

type JotaiStorageOptions<Value> = Parameters<typeof atomWithStorage<Value>>[3];

export const createScopedStorageAtomCache = <Value>({
  defaultValue,
  storage,
  options
}: {
  defaultValue: Value;
  storage?: JotaiStorage<Value>;
  options?: JotaiStorageOptions<Value>;
}) => {
  const atomsByStorageKey = new Map<
    string,
    ReturnType<typeof atomWithStorage<Value>>
  >();

  const unresolvedScopeAtom = atomWithStorage<Value>(
    UNRESOLVED_SCOPE_KEY_PREFIX,
    defaultValue,
    createInMemoryStorage<Value>(),
    options
  );

  return (storageKey: string | undefined) => {
    if (!storageKey) {
      return unresolvedScopeAtom;
    }

    if (!atomsByStorageKey.has(storageKey)) {
      atomsByStorageKey.set(
        storageKey,
        atomWithStorage<Value>(storageKey, defaultValue, storage, options)
      );
    }

    return atomsByStorageKey.get(storageKey)!;
  };
};
