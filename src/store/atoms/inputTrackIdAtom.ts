"use client";

import { useUser } from "@clerk/react";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";

import { buildPrefixedStorageKey } from "../utils/buildPrefixedStorageKey";
import { createInMemoryStorage } from "../utils/createInMemoryStorage";
import { createScopedStorageAtomCache } from "../utils/createScopedStorageAtomCache";

const getInputTrackIdStorageAtom = createScopedStorageAtomCache<
  string | undefined
>({
  defaultValue: undefined,
  storage: createInMemoryStorage<string | undefined>()
});

export function useInputTrackIdAtom() {
  const projectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const { user } = useUser();

  return getInputTrackIdStorageAtom(
    buildPrefixedStorageKey("input-track-id", {
      level: "shot",
      userId: user?.id,
      projectId,
      shotId: selectedShotId
    })
  );
}
