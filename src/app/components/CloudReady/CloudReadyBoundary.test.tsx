import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ isLoaded: false }));

vi.mock("@platform/identity", () => ({
  useAuth: () => ({ isLoaded: mocks.isLoaded })
}));

import { CloudReadyBoundary } from "./CloudReadyBoundary";

describe("CloudReadyBoundary", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "mago");
    mocks.isLoaded = false;
  });

  it("shows cached desktop content while cloud identity initializes", () => {
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: { account: { mode: "cloud" } }
    });

    render(
      <CloudReadyBoundary>
        <div>Cached projects</div>
      </CloudReadyBoundary>
    );

    expect(screen.getByText("Cached projects")).toBeVisible();
  });
});
