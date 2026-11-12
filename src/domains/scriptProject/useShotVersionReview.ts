import { useUser } from "@platform/identity";
import { buildUserScopedStorageKey } from "@store/utils/buildUserScopedStorageKey";
import { useCallback, useMemo, useSyncExternalStore } from "react";

type Review = {
  viewed: string[];
  ratings: Record<string, -1 | 1>;
  isBaselineRecorded: boolean;
};
const empty = '{"viewed":[],"ratings":{}}';
const eventName = "mago:shot-version-review";
const read = (key: string | undefined, projectId: string): string => {
  if (!key) return empty;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) return stored;
    const claimKey = `mago:script-project:${projectId}:review-migrated-to`;
    if (window.localStorage.getItem(claimKey)) return empty;
    const viewed = window.localStorage.getItem(
      `mago:script-project:${projectId}:viewed-shot-versions`
    );
    const ratings = window.localStorage.getItem(
      `mago:script-project:${projectId}:shot-version-ratings`
    );
    if (!viewed && !ratings) return empty;
    const migrated = JSON.stringify(
      parse(
        JSON.stringify({
          viewed: JSON.parse(viewed ?? "[]"),
          ratings: JSON.parse(ratings ?? "{}")
        })
      )
    );
    window.localStorage.setItem(key, migrated);
    window.localStorage.setItem(claimKey, key);
    return migrated;
  } catch {
    return empty;
  }
};
const parse = (value: string): Review => {
  try {
    const parsed = JSON.parse(value);
    return {
      viewed: Array.isArray(parsed?.viewed)
        ? parsed.viewed.filter((id: unknown) => typeof id === "string")
        : [],
      ratings: Object.fromEntries(
        Object.entries(parsed?.ratings ?? {}).filter(
          ([, rating]) => rating === 1 || rating === -1
        )
      ) as Review["ratings"],
      isBaselineRecorded: parsed?.isBaselineRecorded === true
    };
  } catch {
    return { viewed: [], ratings: {}, isBaselineRecorded: false };
  }
};

/** Review marks are personal UI state, not fields in the backend shot contract. */
export const useShotVersionReview = (projectId: string) => {
  const { user } = useUser();
  const key = buildUserScopedStorageKey("shot-version-review", {
    level: "project",
    userId: user?.id,
    projectId
  });
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!key) return () => {};
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) onChange();
      };
      const onLocal = (event: Event) => {
        if ((event as CustomEvent).detail === key) onChange();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(eventName, onLocal);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(eventName, onLocal);
      };
    },
    [key]
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    useCallback(() => read(key, projectId), [key, projectId]),
    () => empty
  );
  const review = useMemo(() => parse(snapshot), [snapshot]);
  const update = useCallback(
    (change: (current: Review) => Review) => {
      if (!key) return;
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify(change(parse(read(key, projectId))))
        );
        window.dispatchEvent(new CustomEvent(eventName, { detail: key }));
      } catch {
        /* Playback and pinning remain available without storage. */
      }
    },
    [key, projectId]
  );
  return {
    isReviewStorageReady: key !== undefined,
    viewedVersionIds: useMemo(() => new Set(review.viewed), [review.viewed]),
    ratingsByAssetId: review.ratings,
    isVersionBaselineRecorded: review.isBaselineRecorded,
    recordVersionBaseline: (finishedVersionIds: string[]) =>
      update((current) => ({
        ...current,
        viewed: [...new Set([...current.viewed, ...finishedVersionIds])],
        isBaselineRecorded: true
      })),
    markVersionsViewed: (ids: string[]) => {
      const isEveryVersionAlreadyViewed = ids.every((id) =>
        review.viewed.includes(id)
      );
      if (isEveryVersionAlreadyViewed) return;
      update((current) => ({
        ...current,
        viewed: [...new Set([...current.viewed, ...ids])]
      }));
    },
    setVersionRating: (assetId: string, rating: -1 | 0 | 1) =>
      update((current) => {
        const ratings = { ...current.ratings };
        if (rating === 0) delete ratings[assetId];
        else ratings[assetId] = rating;
        return { ...current, ratings };
      })
  };
};
