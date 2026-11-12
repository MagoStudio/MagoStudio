import {
  MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
  ShotRenderEngine
} from "@domains/scriptProject/constants";
import { resolveSequentialShotConfig } from "@domains/scriptProject/utils/resolveSequentialShotConfig";
import { VideoEngine } from "@models/video/types";
import { ProjectStateSchema } from "@schemas/scriptProject";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { ShotSequentialControls } from "./ShotSequentialControls";

const DEFAULT_TEXT =
  "The last frame of the preceding shot. Only the camera changes.";
const PIN_TEXT = "The opening frame of this shot. Keep the camera locked.";
const KEY_FRAMES_TEXT = "Frames from the preceding shot, for the look only.";
const DEFAULTS = {
  last_frame: { cut: DEFAULT_TEXT, pin: PIN_TEXT, off: KEY_FRAMES_TEXT },
  key_frames: KEY_FRAMES_TEXT
};

const parseState = (
  sequential: object,
  sequentialPrompt: string | null,
  defaults: object = DEFAULTS
) =>
  ProjectStateSchema.parse({
    project_id: "project",
    keys: [],
    sequential_prompt_defaults: defaults,
    shots: [
      { timeline_id: "first", shot_index: 0, sequence_id: 1, dialogue: [] },
      {
        timeline_id: "second",
        shot_index: 1,
        sequence_id: 2,
        dialogue: [],
        sequential,
        sequential_prompt: sequentialPrompt
      }
    ]
  });

const renderControls = (
  sequential: object,
  sequentialPrompt: string | null,
  onChange = vi.fn(),
  defaults?: object,
  shotEngine: ShotRenderEngine = MINIMAX_H3_MAX_SHOT_RENDER_ENGINE
) => {
  const state = parseState(sequential, sequentialPrompt, defaults);
  const [predecessorShot, shot] = state.shots;
  return (
    <ShotSequentialControls
      sequential={resolveSequentialShotConfig(shot!.sequential)}
      sequentialPromptDefaults={state.sequential_prompt_defaults}
      predecessorShot={predecessorShot!}
      shotEngine={shotEngine}
      isDisabled={false}
      onChange={onChange}
      testIdSuffix={2}
    />
  );
};

const setup = (sequential: object, sequentialPrompt: string | null) => {
  const onChange = vi.fn();
  const screen = renderWithProviders(
    renderControls(sequential, sequentialPrompt, onChange)
  );
  return { screen, onChange };
};

describe("ShotSequentialControls", () => {
  it("shows the continuation text in effect, not a placeholder", () => {
    const { screen } = setup(
      { enabled: true, mode: "last_frame" },
      DEFAULT_TEXT
    );

    expect(screen.getByTestId("shot-sequential-appendix-2")).toHaveValue(
      DEFAULT_TEXT
    );
    expect(screen.queryByTestId("shot-sequential-appendix-reset-2")).toBeNull();
  });

  it("does not save the default text just because the box lost focus", () => {
    const { screen, onChange } = setup(
      { enabled: true, mode: "last_frame" },
      DEFAULT_TEXT
    );

    fireEvent.blur(screen.getByTestId("shot-sequential-appendix-2"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("saves an edited text as the shot's own", () => {
    const { screen, onChange } = setup(
      { enabled: true, mode: "last_frame" },
      DEFAULT_TEXT
    );
    const box = screen.getByTestId("shot-sequential-appendix-2");

    fireEvent.change(box, { target: { value: "She stays seated." } });
    fireEvent.blur(box);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ prompt_appendix: "She stays seated." })
    );
  });

  it("puts the default back when its box is cleared, without saving", () => {
    const { screen, onChange } = setup(
      { enabled: true, mode: "last_frame" },
      DEFAULT_TEXT
    );
    const box = screen.getByTestId("shot-sequential-appendix-2");

    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "  " } });
    fireEvent.blur(box);

    expect(box).toHaveValue(DEFAULT_TEXT);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ prompt_appendix: "" })
    );
  });

  it("keeps what the user is typing when a new default arrives", () => {
    const sequential = { enabled: true, mode: "last_frame" };
    const { screen } = setup(sequential, DEFAULT_TEXT);
    const box = screen.getByTestId("shot-sequential-appendix-2");

    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "She stays seated." } });
    screen.rerender(
      renderControls(sequential, DEFAULT_TEXT, vi.fn(), {
        last_frame: { cut: "A newer default." }
      })
    );

    expect(box).toHaveValue("She stays seated.");
  });

  it("resets the shot's own text to the default", () => {
    const { screen, onChange } = setup(
      {
        enabled: true,
        mode: "last_frame",
        prompt_appendix: "She stays seated."
      },
      "She stays seated."
    );

    fireEvent.click(screen.getByTestId("shot-sequential-appendix-reset-2"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ prompt_appendix: "" })
    );
  });

  it("shows the picked option's default before it is saved", () => {
    const { screen } = setup({ enabled: false }, null);

    screen.rerender(
      renderControls({ enabled: true, mode: "last_frame" }, null)
    );
    const box = screen.getByTestId("shot-sequential-appendix-2");
    expect(box).toHaveValue(DEFAULT_TEXT);

    screen.rerender(
      renderControls(
        { enabled: true, mode: "last_frame", opening_frame: "pin" },
        DEFAULT_TEXT
      )
    );
    expect(box).toHaveValue(PIN_TEXT);

    screen.rerender(
      renderControls({ enabled: true, mode: "key_frames" }, DEFAULT_TEXT)
    );
    expect(box).toHaveValue(KEY_FRAMES_TEXT);
  });

  it("keeps the shot's own text when the option changes", () => {
    const own = { prompt_appendix: "She stays seated." };
    const { screen } = setup(
      { enabled: true, mode: "last_frame", ...own },
      "She stays seated."
    );

    screen.rerender(
      renderControls(
        { enabled: true, mode: "key_frames", ...own },
        "She stays seated."
      )
    );

    expect(screen.getByTestId("shot-sequential-appendix-2")).toHaveValue(
      "She stays seated."
    );
  });

  it("offers how a last-frame shot continues", () => {
    expect(
      setup(
        { enabled: true, mode: "last_frame" },
        DEFAULT_TEXT
      ).screen.queryByTestId("shot-sequential-opening-frame-2")
    ).not.toBeNull();
  });

  it("hides the opening frame choice for key frames", () => {
    expect(
      setup(
        { enabled: true, mode: "key_frames" },
        DEFAULT_TEXT
      ).screen.queryByTestId("shot-sequential-opening-frame-2")
    ).toBeNull();
  });

  it("warns that Seedance 2.5 may not open exactly on the previous frame", () => {
    const pinnedLastFrame = {
      enabled: true,
      mode: "last_frame",
      opening_frame: "pin"
    };
    const hintTestId = "shot-sequential-opening-frame-prompt-only-hint-2";

    const seedanceScreen = renderWithProviders(
      renderControls(
        pinnedLastFrame,
        PIN_TEXT,
        vi.fn(),
        undefined,
        VideoEngine.seedance_2_5
      )
    );
    expect(seedanceScreen.queryByTestId(hintTestId)).not.toBeNull();
    seedanceScreen.unmount();

    expect(
      setup(pinnedLastFrame, PIN_TEXT).screen.queryByTestId(hintTestId)
    ).toBeNull();
  });
});
