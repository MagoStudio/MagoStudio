import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSceneShotLayoutDraft } from "./useSceneShotLayoutDraft";

const savedScene = (videoPrompt: string) => ({
  timeline_id: "scene",
  duration_s: 5,
  video_prompt: videoPrompt,
  dialogue: []
});

describe("useSceneShotLayoutDraft", () => {
  it("keeps typing that is not saved yet when the saved scene changes", () => {
    const { result, rerender } = renderHook(
      ({ shot }) => useSceneShotLayoutDraft(shot),
      { initialProps: { shot: savedScene("Ruby runs home.") } }
    );
    act(() =>
      result.current.setSceneShotLayout((layout) => ({
        ...layout,
        shots: layout.shots.map((shot) => ({
          ...shot,
          description: "Ruby runs home. Then she stops."
        }))
      }))
    );

    rerender({ shot: savedScene("Ruby runs home. Then") });

    expect(result.current.sceneShotLayout.shots[0]?.description).toBe(
      "Ruby runs home. Then she stops."
    );
  });

  it("takes the new saved scene when nothing was typed", () => {
    const { result, rerender } = renderHook(
      ({ shot }) => useSceneShotLayoutDraft(shot),
      { initialProps: { shot: savedScene("Ruby runs home.") } }
    );

    rerender({ shot: savedScene("Ruby walks home.") });

    expect(result.current.sceneShotLayout.shots[0]?.description).toBe(
      "Ruby walks home."
    );
  });
});
