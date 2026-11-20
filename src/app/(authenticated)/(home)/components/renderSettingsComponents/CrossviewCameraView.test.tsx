import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CrossviewCameraView } from "./CrossviewCameraView";
import type { RenderSettingComponentProps } from "./interface";

const writeAzimuthDegrees = vi.fn();
const writeElevationDegrees = vi.fn();

const CrossviewCameraViewWithSettingValues = ({
  initialAzimuthDegrees = 30,
  initialElevationDegrees = 0
}: {
  initialAzimuthDegrees?: number;
  initialElevationDegrees?: number;
}) => {
  const [azimuthDegrees, setAzimuthDegrees] = useState(initialAzimuthDegrees);
  const [elevationDegrees, setElevationDegrees] = useState(
    initialElevationDegrees
  );
  const props = {
    label: "New camera",
    isDisabled: false,
    value: azimuthDegrees,
    secondValue: elevationDegrees,
    setValue: (nextAzimuthDegrees: number | undefined) => {
      writeAzimuthDegrees(nextAzimuthDegrees);
      setAzimuthDegrees(nextAzimuthDegrees ?? 0);
    },
    setSecondValue: (nextElevationDegrees: number | undefined) => {
      writeElevationDegrees(nextElevationDegrees);
      setElevationDegrees(nextElevationDegrees ?? 0);
    }
  } as unknown as RenderSettingComponentProps<number>;
  return <CrossviewCameraView {...props} />;
};

describe("CrossviewCameraView keyboard", () => {
  const shortcutListener = vi.fn();

  const renderLikeTheApp = (ui: React.ReactElement) => {
    const reactRoot = document.createElement("div");
    document.body.append(reactRoot);
    const rendered = render(ui, { container: reactRoot });
    reactRoot.addEventListener("keydown", shortcutListener);
    return { ...rendered, reactRoot };
  };

  afterEach(() => {
    shortcutListener.mockReset();
    writeAzimuthDegrees.mockReset();
    writeElevationDegrees.mockReset();
    document.body.innerHTML = "";
  });

  it("stops the arrow keys before the shortcuts on React's own root see them", () => {
    renderLikeTheApp(<CrossviewCameraViewWithSettingValues />);
    const cameraView = screen.getByRole("application");

    fireEvent.keyDown(cameraView, { key: "ArrowLeft" });

    expect(shortcutListener).not.toHaveBeenCalled();
    expect(writeAzimuthDegrees).toHaveBeenLastCalledWith(25);
  });

  it("moves the camera up and down one degree per arrow press", () => {
    renderLikeTheApp(<CrossviewCameraViewWithSettingValues />);
    const cameraView = screen.getByRole("application");

    fireEvent.keyDown(cameraView, { key: "ArrowUp" });
    expect(writeElevationDegrees).toHaveBeenLastCalledWith(1);

    fireEvent.keyDown(cameraView, { key: "ArrowDown" });
    fireEvent.keyDown(cameraView, { key: "ArrowDown" });
    expect(writeElevationDegrees).toHaveBeenLastCalledWith(-1);
  });

  it("lets other keys through to the shortcuts", () => {
    renderLikeTheApp(<CrossviewCameraViewWithSettingValues />);

    fireEvent.keyDown(screen.getByRole("application"), { key: "a" });

    expect(shortcutListener).toHaveBeenCalledTimes(1);
  });

  it("keeps dragging a pen or touch pointer that reports no pressed buttons", () => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.hasPointerCapture = vi.fn(() => true);
    renderLikeTheApp(<CrossviewCameraViewWithSettingValues />);
    const cameraView = screen.getByRole("application");
    vi.spyOn(cameraView, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 200, 100)
    );

    fireEvent.pointerMove(cameraView, {
      pointerId: 1,
      buttons: 0,
      clientX: 10,
      clientY: 50
    });

    expect(writeAzimuthDegrees).toHaveBeenCalled();
  });

  it("takes keyboard focus when the camera is dragged, so arrows move the camera", () => {
    Element.prototype.setPointerCapture = vi.fn();
    renderLikeTheApp(
      <>
        <button type="button">Render Track</button>
        <CrossviewCameraViewWithSettingValues />
      </>
    );
    screen.getByRole("button", { name: "Render Track" }).focus();
    const cameraView = screen.getByRole("application");

    fireEvent.pointerDown(cameraView, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "ArrowUp"
    });

    expect(document.activeElement).toBe(cameraView);
    expect(shortcutListener).not.toHaveBeenCalled();
  });
});
