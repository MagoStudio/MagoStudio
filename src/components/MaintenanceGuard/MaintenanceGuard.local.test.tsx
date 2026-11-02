import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MaintenanceGuard } from "./index";

const mocks = vi.hoisted(() => ({
  useMagoState: vi.fn(),
  refetch: vi.fn()
}));

vi.mock("@domains/app/useMagoState", () => ({
  useMagoState: mocks.useMagoState
}));

const setAccountMode = (mode: "cloud" | "offline") => {
  Object.defineProperty(window, "mago", {
    configurable: true,
    writable: true,
    value: { account: { mode, chooseMode: vi.fn(() => Promise.resolve()) } }
  });
};

const renderGuardedApp = () =>
  render(
    <MaintenanceGuard>
      <div>Local projects</div>
    </MaintenanceGuard>
  );

afterEach(() => {
  Reflect.deleteProperty(window, "mago");
  mocks.useMagoState.mockReset();
});

describe("MaintenanceGuard in Mago Studio", () => {
  it("never asks the cloud for its state while working offline", () => {
    setAccountMode("offline");

    renderGuardedApp();

    expect(screen.getByText("Local projects")).toBeInTheDocument();
    expect(mocks.useMagoState).not.toHaveBeenCalled();
  });

  it("keeps the app usable while the cloud state is still loading", () => {
    setAccountMode("cloud");
    mocks.useMagoState.mockReturnValue({
      data: undefined,
      refetch: mocks.refetch
    });

    renderGuardedApp();

    expect(screen.getByText("Local projects")).toBeInTheDocument();
  });

  it("offers to work offline instead of the app when the cloud is in maintenance", () => {
    setAccountMode("cloud");
    mocks.useMagoState.mockReturnValue({
      data: { "release-ongoing": true, version: "1" },
      refetch: mocks.refetch
    });

    renderGuardedApp();

    expect(screen.queryByText("Local projects")).not.toBeInTheDocument();
    expect(screen.getByTestId("cloud-maintenance-notice")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Work offline" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" })
    ).toBeInTheDocument();
  });
});
