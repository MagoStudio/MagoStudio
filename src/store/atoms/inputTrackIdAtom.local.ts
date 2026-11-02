"use client";

import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useUser } from "@platform/identity";

import { buildPrefixedStorageKey } from "../utils/buildPrefixedStorageKey";
import { createScopedStorageAtomCache } from "../utils/createScopedStorageAtomCache";

const getInputTrackIdStorageAtom = createScopedStorageAtomCache<
  string | undefined
>({ defaultValue: undefined, options: { getOnInit: true } });

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
