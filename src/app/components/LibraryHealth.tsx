"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

import type { LibraryIssue } from "../../../desktop/shared/contracts";

const HEALTH_POLL_MS = 5000;
const HealthContext = createContext<LibraryIssue[]>([]);
export const useLibraryIssues = () => useContext(HealthContext);

export const ProjectDataWarning = ({
  projectId
}: {
  projectId: string | null | undefined;
}) => {
  const issue = useLibraryIssues().find(
    (item) => item.kind === "project" && item.projectId === projectId
  );
  if (!issue) return null;
  return (
    <div
      role="alert"
      className="shrink-0 border-b border-amber-500 bg-surface-bg-100 p-3 text-sm"
    >
      Saved project data could not be read. The original data has been kept. Use
      “Library needs attention” to view details or restore a database backup.
    </div>
  );
};

export const LibraryHealth = ({ children }: { children: ReactNode }) => {
  const [issues, setIssues] = useState<LibraryIssue[]>([]);
  const [logError, setLogError] = useState("");
  useEffect(() => {
    const library = window.mago?.library;
    if (!library?.issues) return;
    let stopped = false;
    const read = async () => {
      try {
        const next = await library.issues();
        if (!stopped) setIssues(next);
      } catch {
        if (!stopped)
          setIssues([
            {
              id: "health",
              kind: "service",
              message:
                "Unable to check library status. Restart Mago if library operations are failing."
            }
          ]);
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
  }, []);
  return (
    <HealthContext.Provider value={issues}>
      {children}
      {issues.length > 0 && (
        <aside
          role="status"
          className="fixed bottom-4 right-4 z-toast max-w-md rounded-xl border border-amber-500 bg-surface-bg-100 p-4 shadow-lg"
        >
          <details>
            <summary className="cursor-pointer">
              Library needs attention ({issues.length})
            </summary>
            <ul className="mt-2 max-h-52 overflow-auto text-sm">
              {issues.map((issue) => (
                <li key={issue.id} className="mb-2">
                  {issue.message}
                </li>
              ))}
            </ul>
          </details>
          <button
            type="button"
            className="mt-2 underline"
            onClick={() => {
              void window.mago?.library
                .openLogs()
                .catch(() => setLogError("Could not open the logs folder."));
            }}
          >
            Open logs
          </button>
          <button
            type="button"
            className="ml-4 mt-2 underline"
            onClick={() => {
              void window.mago?.library
                .restoreBackup()
                .catch((error: unknown) =>
                  setLogError(
                    error instanceof Error
                      ? error.message
                      : "Could not restore the backup."
                  )
                );
            }}
          >
            Restore database backup
          </button>
          {logError && <p>{logError}</p>}
        </aside>
      )}
    </HealthContext.Provider>
  );
};
