import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  })
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect,
  useParams: () => ({ accessKey: LONG_FORM_RUN_ACCESS_KEY })
}));
vi.mock("@home/long-form/[accessKey]/components/LongFormRunScreen", () => ({
  LongFormRunScreen: () => <div data-testid="long-form-run-screen" />
}));

import { LONG_FORM_RUN_ACCESS_KEY } from "@domains/longFormRun/constants";

import LongFormPage from "./page";

const stubAccountMode = (mode: "cloud" | "offline") =>
  vi.stubGlobal("mago", { account: { mode } });

describe("LongFormPage in the desktop app", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends a user with no cloud account home before anything reaches the cloud", () => {
    stubAccountMode("offline");

    expect(() => render(<LongFormPage />)).toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
    expect(screen.queryByTestId("long-form-run-screen")).toBeNull();
  });

  it("shows the long-form run to a signed-in user", () => {
    stubAccountMode("cloud");

    render(<LongFormPage />);

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByTestId("long-form-run-screen")).toBeInTheDocument();
  });
});
