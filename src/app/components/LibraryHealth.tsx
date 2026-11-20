"use client";

import { GhostButton } from "@components/GhostButton";
import { Text } from "@components/Text";
import { useMountEffect } from "@hooks/useMountEffect";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { LibraryIssue } from "../../../desktop/shared/contracts";

import { formatLibraryIssueDetails } from "./utils/formatLibraryIssueDetails";
import { libraryIssueKindLabelKey } from "./utils/libraryIssueKindLabelKey";

const HEALTH_POLL_MS = 5000;
const HealthContext = createContext<LibraryIssue[]>([]);
export const useLibraryIssues = () => useContext(HealthContext);

export const ProjectDataWarning = ({
  projectId
}: {
  projectId: string | null | undefined;
}) => {
  const { t } = useTranslation();
  const issue = useLibraryIssues().find(
    (item) => item.kind === "project" && item.projectId === projectId
  );
  if (!issue) return null;
  return (
    <div
      role="alert"
      className="shrink-0 border-b border-amber-500 bg-element-tertiary p-3"
    >
      <Text component="p" variant="sm">
        {t("libraryHealth.projectDataWarning")}
      </Text>
    </div>
  );
};

export const LibraryHealth = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [reportedIssues, setReportedIssues] = useState<LibraryIssue[]>([]);
  const [isLibraryStatusUnavailable, setIsLibraryStatusUnavailable] =
    useState(false);
  const [actionResult, setActionResult] = useState<{
    message: string;
    issuesSignature: string;
  } | null>(null);
  useMountEffect(() => {
    const library = window.mago?.library;
    if (!library?.issues) return;
    let stopped = false;
    const read = async () => {
      try {
        const next = await library.issues();
        if (stopped) return;
        setReportedIssues(next);
        setIsLibraryStatusUnavailable(false);
      } catch {
        if (!stopped) setIsLibraryStatusUnavailable(true);
      }
    };
    void read();
    const timer = setInterval(() => {
      void read();
    }, HEALTH_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  });
  const issues: LibraryIssue[] = isLibraryStatusUnavailable
    ? [
        {
          id: "health",
          kind: "service",
          message: t("libraryHealth.statusUnavailable")
        }
      ]
    : reportedIssues;
  const issuesSignature = JSON.stringify(
    issues.map((issue) => [issue.id, issue.message])
  );
  const setActionMessage = (message: string) =>
    setActionResult({ message, issuesSignature });
  const actionMessageForCurrentIssues =
    actionResult?.issuesSignature === issuesSignature
      ? actionResult.message
      : "";
  const canDatabaseRestoreFixAnIssue = issues.some(
    (issue) => issue.isFixableByDatabaseRestore
  );
  const copyIssueDetails = async () => {
    try {
      const appVersion = (await window.mago?.app.version()) ?? "unknown";
      await navigator.clipboard.writeText(
        formatLibraryIssueDetails(appVersion, issues)
      );
      setActionMessage(t("libraryHealth.detailsCopied"));
    } catch {
      setActionMessage(t("libraryHealth.copyFailed"));
    }
  };
  return (
    <HealthContext.Provider value={issues}>
      {children}
      {issues.length > 0 && (
        <aside
          role="status"
          className="fixed bottom-4 right-4 z-toast max-w-md rounded-xl border border-amber-500 bg-element-tertiary p-4 shadow-lg"
        >
          <details open>
            <summary className="cursor-pointer">
              <Text component="span" weight="medium">
                {t("libraryHealth.title", { count: issues.length })}
              </Text>
            </summary>
            <ul className="mt-2 max-h-52 overflow-auto">
              {issues.map((issue) => (
                <li key={issue.id} className="mb-2">
                  <Text component="span" variant="sm" weight="semibold">
                    {t(libraryIssueKindLabelKey(issue))}
                  </Text>
                  <Text component="span" variant="sm">
                    {" · "}
                    {issue.message}
                  </Text>
                </li>
              ))}
            </ul>
          </details>
          <div className="mt-2 flex flex-wrap gap-2">
            <GhostButton
              size="sm"
              colorScheme="stroke"
              onPress={() => {
                void copyIssueDetails();
              }}
            >
              {t("libraryHealth.copyDetails")}
            </GhostButton>
            <GhostButton
              size="sm"
              colorScheme="stroke"
              onPress={() => {
                void window.mago?.library
                  .openLogs()
                  .catch(() =>
                    setActionMessage(t("libraryHealth.openLogsFailed"))
                  );
              }}
            >
              {t("libraryHealth.openLogs")}
            </GhostButton>
            {canDatabaseRestoreFixAnIssue && (
              <GhostButton
                size="sm"
                colorScheme="stroke"
                onPress={() => {
                  void window.mago?.library
                    .restoreBackup()
                    .catch((error: unknown) =>
                      setActionMessage(
                        error instanceof Error
                          ? error.message
                          : t("libraryHealth.restoreFailed")
                      )
                    );
                }}
              >
                {t("libraryHealth.restoreBackup")}
              </GhostButton>
            )}
          </div>
          {actionMessageForCurrentIssues && (
            <Text component="p" variant="sm" className="mt-2">
              {actionMessageForCurrentIssues}
            </Text>
          )}
        </aside>
      )}
    </HealthContext.Provider>
  );
};
