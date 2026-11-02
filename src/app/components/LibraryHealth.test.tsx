import {
  LibraryHealth,
  ProjectDataWarning
} from "@app/components/LibraryHealth";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("keeps content visible with a project warning and exposes logs and recovery", async () => {
  const openLogs = vi.fn().mockResolvedValue(undefined);
  const restoreBackup = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("mago", {
    library: {
      issues: vi.fn().mockResolvedValue([
        {
          id: "damaged",
          kind: "project",
          projectId: "project",
          message: "Saved timeline is damaged"
        }
      ]),
      openLogs,
      restoreBackup
    }
  });
  render(
    <LibraryHealth>
      <p>Other project content</p>
      <ProjectDataWarning projectId="project" />
    </LibraryHealth>
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Saved project data could not be read"
  );
  expect(screen.getByText("Other project content")).toBeVisible();
  fireEvent.click(screen.getByText("Library needs attention (1)"));
  expect(screen.getByText("Saved timeline is damaged")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Open logs" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Restore database backup" })
  );
  expect(openLogs).toHaveBeenCalledOnce();
  expect(restoreBackup).toHaveBeenCalledOnce();
});
