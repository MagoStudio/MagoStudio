import { HistoryMutationRecord } from "./historyMutationLog";

export type NavigationKind =
  | "reload"
  | "navigate"
  | "back_forward"
  | "prerender"
  | "unknown";

export const getNavigationKind = (
  entryType: string | undefined
): NavigationKind => {
  switch (entryType) {
    case "reload":
    case "navigate":
    case "back_forward":
    case "prerender":
      return entryType;
    default:
      return "unknown";
  }
};

export const formatHistoryMutation = (record: HistoryMutationRecord): string =>
  `${record.method} ${record.url} @ ${record.stackTop}`;
