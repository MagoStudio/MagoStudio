import { useUser } from "@platform/identity";
import { buildPrefixedStorageKey } from "@store/utils/buildPrefixedStorageKey";
import { UNRESOLVED_SCOPE_KEY_PREFIX } from "@store/utils/storageScope";
import { useLocalStorage } from "usehooks-ts";

export const useDismissibleHint = (id: string) => {
  const { user } = useUser();
  const hintName = `${id}-dismissed`;
  const storageKey = buildPrefixedStorageKey(hintName, {
    level: "user",
    userId: user?.id
  });
  const [isDismissed, setIsDismissed] = useLocalStorage<boolean>(
    storageKey ?? `${UNRESOLVED_SCOPE_KEY_PREFIX}${hintName}`,
    false
  );

  return {
    isDismissed,
    dismiss: () => {
      if (!storageKey) {
        return;
      }
      setIsDismissed(true);
    },
    isUserReady: !!user
  };
};
