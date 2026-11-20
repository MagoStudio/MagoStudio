import {
  LibraryHealth,
  ProjectDataWarning
} from "@app/components/LibraryHealth";
import { i18n } from "@config/i18n";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, expect, it, vi } from "vitest";

import type { LibraryIssue } from "../../../desktop/shared/contracts";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const stubLibrary = (issues: LibraryIssue[]) => {
  const library = {
    issues: vi.fn().mockResolvedValue(issues),
    openLogs: vi.fn().mockResolvedValue(undefined),
    restoreBackup: vi.fn().mockResolvedValue(undefined)
  };
  vi.stubGlobal("mago", {
    library,
    app: { version: vi.fn().mockResolvedValue("1.4.0") }
  });
  return library;
};

const renderPanel = (children: ReactNode = null) =>
  render(
    <I18nextProvider i18n={i18n}>
      <LibraryHealth>{children}</LibraryHealth>
    </I18nextProvider>
  );

const damagedProjectIssue: LibraryIssue = {
  id: "damaged",
  kind: "project",
  projectId: "project",
  isFixableByDatabaseRestore: true,
  message: "Saved timeline is damaged"
};

it("keeps content visible with a project warning and exposes logs and recovery", async () => {
  const library = stubLibrary([damagedProjectIssue]);
  renderPanel(
    <>
      <p>Other project content</p>
      <ProjectDataWarning projectId="project" />
    </>
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Saved project data could not be read"
  );
  expect(screen.getByText("Other project content")).toBeVisible();
  expect(screen.getByText("Library needs attention (1)")).toBeVisible();
  expect(screen.getByText("Project data")).toBeVisible();
  expect(screen.getByText(/Saved timeline is damaged/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Open logs" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Restore database backup" })
  );
  expect(library.openLogs).toHaveBeenCalledOnce();
  expect(library.restoreBackup).toHaveBeenCalledOnce();
});

it("does not offer a database restore for render and media issues", async () => {
  stubLibrary([
    { id: "render:job", kind: "asset", message: "Render failed" },
    {
      id: "render-poll:job",
      kind: "service",
      message: "Unable to check render job. Retrying automatically."
    }
  ]);
  renderPanel();
  expect(await screen.findByText(/Render failed/)).toBeVisible();
  expect(screen.getByText("File or render")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Restore database backup" })
  ).toBeNull();
});

it("offers a database restore when the database is damaged", async () => {
  stubLibrary([
    {
      id: "database",
      kind: "database",
      isFixableByDatabaseRestore: true,
      message: "Library access paused"
    }
  ]);
  renderPanel();
  expect(await screen.findByText("Database")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Restore database backup" })
  ).toBeVisible();
});

it("copies the app version and every issue", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true
  });
  stubLibrary([
    damagedProjectIssue,
    { id: "render:job", kind: "asset", message: "Render failed" }
  ]);
  renderPanel();
  fireEvent.click(await screen.findByRole("button", { name: "Copy details" }));
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith(
      [
        "Mago Studio 1.4.0",
        "project · damaged · Saved timeline is damaged",
        "asset · render:job · Render failed"
      ].join("\n")
    )
  );
  expect(await screen.findByText("Details copied.")).toBeVisible();
});

it("drops an action result once the issues it was about change", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true
  });
  const library = stubLibrary([damagedProjectIssue]);
  library.issues
    .mockResolvedValueOnce([damagedProjectIssue])
    .mockResolvedValue([
      { id: "render:job", kind: "asset", message: "Render failed" }
    ]);
  renderPanel();
  fireEvent.click(await screen.findByRole("button", { name: "Copy details" }));
  expect(await screen.findByText("Details copied.")).toBeVisible();

  await act(() => vi.advanceTimersByTimeAsync(5000));

  expect(await screen.findByText(/Render failed/)).toBeVisible();
  expect(screen.queryByText("Details copied.")).toBeNull();
});
