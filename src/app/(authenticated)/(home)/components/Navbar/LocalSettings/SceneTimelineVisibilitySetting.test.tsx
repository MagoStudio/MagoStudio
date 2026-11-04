import { SCENE_TIMELINE_SHOWN_KEY } from "@hooks/userLocalStorage/useSceneTimelineVisibilitySetting";
import { fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { SceneTimelineVisibilitySetting } from "./SceneTimelineVisibilitySetting";

beforeEach(() => window.localStorage.clear());

describe("scene timeline visibility setting", () => {
  it("starts on and remembers when it is turned off", () => {
    const screen = renderWithProviders(<SceneTimelineVisibilitySetting />);
    const sceneTimelineSwitch = screen.getByRole("switch", {
      name: "Scene timeline"
    });

    expect(sceneTimelineSwitch).toBeChecked();
    fireEvent.click(sceneTimelineSwitch);

    expect(sceneTimelineSwitch).not.toBeChecked();
    expect(window.localStorage.getItem(SCENE_TIMELINE_SHOWN_KEY)).toBe("false");
  });
});
