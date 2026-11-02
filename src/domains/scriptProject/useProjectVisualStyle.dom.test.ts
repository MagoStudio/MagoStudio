import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useProjectVisualStyle } from "./useProjectVisualStyle";

const { save, project } = vi.hoisted(() => ({
  save: vi.fn(),
  project: {
    current: { id: "p", origin: "local", settings: { visual_style: "Ink" } }
  }
}));

vi.mock("./useSaveProjectSettingsPatch", () => ({
  useSaveProjectSettingsPatch: () => ({
    project: project.current,
    saveProjectSettingsPatchAsync: save
  })
}));

afterEach(() => vi.resetAllMocks());
beforeEach(() => {
  project.current = {
    id: "p",
    origin: "local",
    settings: { visual_style: "Ink" }
  };
});

const setup = () => {
  const client = new QueryClient();
  client.setQueryData(queryKeys.project.byId("p"), project.current);
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return {
    ...renderHook(({ projectId }) => useProjectVisualStyle(projectId), {
      wrapper,
      initialProps: { projectId: "p" }
    }),
    invalidate,
    client
  };
};

describe("useProjectVisualStyle", () => {
  it("does not carry a failed save into a different cached project", async () => {
    save.mockRejectedValue(new Error("Save failed"));
    const { result, rerender, client } = setup();
    act(() => result.current.commitVisualStyle("Failed first-project style"));
    await waitFor(() =>
      expect(result.current.visualStyleSaveFailure).not.toBeNull()
    );
    project.current = {
      id: "other",
      origin: "local",
      settings: { visual_style: "Other project" }
    };
    client.setQueryData(queryKeys.project.byId("other"), project.current);
    rerender({ projectId: "other" });
    expect(result.current.visualStyleShownInField).toBe("Other project");
    expect(result.current.visualStyleSaveFailure).toBeNull();
  });

  it("ignores a previous project's late save failure after navigation", async () => {
    let fail!: (error: Error) => void;
    save.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          fail = reject;
        })
    );
    const { result, rerender, client } = setup();
    act(() => result.current.commitVisualStyle("Pending first-project style"));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    project.current = {
      id: "other",
      origin: "cloud",
      settings: { visual_style: "Other project" }
    };
    client.setQueryData(queryKeys.project.byId("other"), project.current);
    rerender({ projectId: "other" });
    await act(async () => fail(new Error("Late failure")));
    expect(result.current.visualStyleShownInField).toBe("Other project");
    expect(result.current.visualStyleSaveFailure).toBeNull();
  });
  it.each(["local", "cloud"])(
    "saves and clears %s project styles through settings",
    async (origin) => {
      project.current.origin = origin;
      save.mockResolvedValue({});
      const { result, invalidate } = setup();
      expect(result.current.visualStyleShownInField).toBe("Ink");
      act(() => result.current.commitVisualStyle("Watercolour"));
      await waitFor(() =>
        expect(save).toHaveBeenCalledWith({ visual_style: "Watercolour" })
      );
      await waitFor(() =>
        expect(invalidate).toHaveBeenCalledWith({
          queryKey: queryKeys.projectState.byProjectId("p")
        })
      );
      act(() => result.current.commitVisualStyle(""));
      await waitFor(() =>
        expect(save).toHaveBeenLastCalledWith({ visual_style: "" })
      );
    }
  );

  it("serializes edits so an earlier response cannot overwrite a later edit", async () => {
    let finish!: () => void;
    save
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          })
      )
      .mockResolvedValue({});
    const { result } = setup();
    act(() => result.current.commitVisualStyle("First"));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    act(() => result.current.commitVisualStyle("Second"));
    expect(result.current.visualStyleShownInField).toBe("Second");
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    await waitFor(() =>
      expect(save).toHaveBeenLastCalledWith({ visual_style: "Second" })
    );
  });

  it("keeps a failed edit visible and lets the user retry", async () => {
    const error = new Error("Save failed");
    save.mockRejectedValueOnce(error).mockResolvedValue({});
    const { result } = setup();
    act(() => result.current.commitVisualStyle("Paper grain"));
    await waitFor(() =>
      expect(result.current.visualStyleSaveFailure).toEqual({ error })
    );
    expect(result.current.visualStyleShownInField).toBe("Paper grain");
    act(() => result.current.commitVisualStyle("Paper grain"));
    await waitFor(() =>
      expect(result.current.visualStyleSaveFailure).toBeNull()
    );
    expect(save).toHaveBeenCalledTimes(2);
  });
});
