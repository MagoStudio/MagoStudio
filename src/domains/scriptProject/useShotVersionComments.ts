import { useCallback, useMemo, useSyncExternalStore } from "react";

export type ShotVersionCommentField = "good" | "bad" | "todo";
export type ShotVersionComments = Record<ShotVersionCommentField, string>;

type StoredShotVersionComments = ShotVersionComments & {
  scoringSignature?: string;
};

const commentsChangedEvent = "mago:shot-version-comments-changed";
const emptyComments = "{}";
const automaticReviewHeading = "--automatic review--";
const emptyVersionComments = (): ShotVersionComments => ({
  good: "",
  bad: "",
  todo: ""
});
const storageKey = (projectId: string) =>
  `mago:script-project:${projectId}:shot-version-comments`;

const readValue = (projectId: string): string => {
  if (typeof window === "undefined") return emptyComments;
  try {
    return window.localStorage.getItem(storageKey(projectId)) ?? emptyComments;
  } catch {
    return emptyComments;
  }
};

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const parseComments = (
  value: string
): Record<string, StoredShotVersionComments> => {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([assetId, comment]) => {
        if (typeof comment === "string") {
          return [[assetId, { ...emptyVersionComments(), todo: comment }]];
        }
        if (!comment || typeof comment !== "object" || Array.isArray(comment))
          return [];
        const stored = comment as Record<string, unknown>;
        return [
          [
            assetId,
            {
              good: stringValue(stored.good),
              bad: stringValue(stored.bad),
              todo: stringValue(stored.todo),
              ...(typeof stored.scoringSignature === "string"
                ? { scoringSignature: stored.scoringSignature }
                : {})
            }
          ]
        ];
      })
    );
  } catch {
    return {};
  }
};

const writeComments = (
  projectId: string,
  comments: Record<string, StoredShotVersionComments>
) => {
  window.localStorage.setItem(storageKey(projectId), JSON.stringify(comments));
  window.dispatchEvent(
    new CustomEvent(commentsChangedEvent, { detail: projectId })
  );
};

const appendAutomaticReview = (existing: string, automatic: string): string => {
  if (!automatic) return existing;
  const review = `${automaticReviewHeading}\n${automatic}`;
  return existing.trim() ? `${existing.trimEnd()}\n\n${review}` : review;
};

export const useShotVersionComments = (projectId: string) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === storageKey(projectId)) onStoreChange();
      };
      const onLocalChange = (event: Event) => {
        if ((event as CustomEvent<string>).detail === projectId)
          onStoreChange();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(commentsChangedEvent, onLocalChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(commentsChangedEvent, onLocalChange);
      };
    },
    [projectId]
  );
  const getSnapshot = useCallback(() => readValue(projectId), [projectId]);
  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => emptyComments
  );
  const storedCommentsByAssetId = useMemo(() => parseComments(value), [value]);
  const commentsByAssetId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(storedCommentsByAssetId).map(([assetId, comments]) => [
          assetId,
          { good: comments.good, bad: comments.bad, todo: comments.todo }
        ])
      ) as Record<string, ShotVersionComments>,
    [storedCommentsByAssetId]
  );

  const setVersionComment = useCallback(
    (assetId: string, field: ShotVersionCommentField, comment: string) => {
      try {
        const comments = parseComments(readValue(projectId));
        const current = comments[assetId] ?? emptyVersionComments();
        comments[assetId] = { ...current, [field]: comment };
        writeComments(projectId, comments);
      } catch {
        // Review controls remain usable when storage is unavailable.
      }
    },
    [projectId]
  );

  const appendScoringReview = useCallback(
    (assetId: string, issues: string[], nextPrompt: string | null) => {
      try {
        const normalizedIssues = issues
          .map((issue) => issue.trim())
          .filter(Boolean);
        const normalizedNextPrompt = nextPrompt?.trim() ?? "";
        if (normalizedIssues.length === 0) return;

        const scoringSignature = JSON.stringify({
          issues: normalizedIssues,
          nextPrompt: normalizedNextPrompt
        });
        const comments = parseComments(readValue(projectId));
        const current = comments[assetId] ?? emptyVersionComments();
        if (current.scoringSignature === scoringSignature) return;

        comments[assetId] = {
          ...current,
          bad: appendAutomaticReview(current.bad, normalizedIssues.join("\n")),
          todo: appendAutomaticReview(current.todo, normalizedNextPrompt),
          scoringSignature
        };
        writeComments(projectId, comments);
      } catch {
        // Scoring remains visible even when review metadata cannot be stored.
      }
    },
    [projectId]
  );

  return { commentsByAssetId, setVersionComment, appendScoringReview };
};
