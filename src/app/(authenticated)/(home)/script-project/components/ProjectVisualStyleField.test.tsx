import "@config/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

const state = vi.hoisted(() => ({
  projects: {
    a: { id: "a", settings: { visual_style: "A saved" } },
    b: { id: "b", settings: { visual_style: "B saved" } }
  } as Record<string, { id: string; settings: { visual_style: string } }>,
  save: vi.fn()
}));
vi.mock("@domains/scriptProject/useSaveProjectSettingsPatch", () => ({
  useSaveProjectSettingsPatch: (id: string) => ({
    project: state.projects[id],
    saveProjectSettingsPatchAsync: (patch: unknown) => state.save(id, patch)
  })
}));

import { ProjectVisualStyleField } from "./ProjectVisualStyleField";

afterEach(() => vi.resetAllMocks());
describe("ProjectVisualStyleField", () => {
  it("does not retry a failed first-project style against the next cached project on blur", async () => {
    state.save.mockImplementation((id: string) =>
      id === "a"
        ? Promise.reject(new Error("Save failed"))
        : Promise.resolve({})
    );
    const client = new QueryClient();
    Object.values(state.projects).forEach((project) =>
      client.setQueryData(queryKeys.project.byId(project.id), project)
    );
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <ProjectVisualStyleField projectId="a" />
      </QueryClientProvider>
    );
    fireEvent.change(screen.getByTestId("script-project-visual-style"), {
      target: { value: "Failed A draft" }
    });
    fireEvent.blur(screen.getByTestId("script-project-visual-style"));
    await waitFor(() =>
      expect(state.save).toHaveBeenCalledWith("a", {
        visual_style: "Failed A draft"
      })
    );
    await act(async () => {});
    rerender(
      <QueryClientProvider client={client}>
        <ProjectVisualStyleField projectId="b" />
      </QueryClientProvider>
    );
    expect(screen.getByTestId("script-project-visual-style")).toHaveValue(
      "B saved"
    );
    fireEvent.blur(screen.getByTestId("script-project-visual-style"));
    await act(async () => {});
    expect(state.save).toHaveBeenCalledTimes(1);
  });
});
