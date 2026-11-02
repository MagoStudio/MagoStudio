import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRenderMetrics } from "./useRenderMetrics.local";

const mocks = vi.hoisted(() => ({
  findMedia: vi.fn(),
  localMetrics: vi.fn(),
  cloudMetrics: vi.fn(),
  cloudAvailable: vi.fn()
}));
vi.mock("@/platform/localDesktop", () => ({
  getLocalDesktopApi: () => ({
    scriptProjects: {
      findMedia: mocks.findMedia,
      getRenderMetrics: mocks.localMetrics
    }
  })
}));
vi.mock("@/platform/renderTarget", () => ({
  isCloudRenderAvailable: mocks.cloudAvailable
}));
vi.mock("../api/getRenderMetrics", async (original) => ({
  ...(await original<object>()),
  getRenderMetrics: mocks.cloudMetrics
}));

const render = (kind: "video" | "image" = "video") => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useRenderMetrics("asset", kind, true), { wrapper });
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cloudAvailable.mockReturnValue(false);
});

describe("local render metrics routing", () => {
  it("scores local video offline and maps the backend fields for the badge", async () => {
    mocks.findMedia.mockResolvedValue({
      kind: "shot-version",
      projectId: "local"
    });
    mocks.localMetrics.mockResolvedValue({
      status: "COMPLETED",
      vid_score: 8.5,
      vid_pass: true,
      vid_temporal_identity: 9,
      vid_next_prompt: "Hold identity"
    });
    const { result } = render();
    await waitFor(() => expect(result.current.data?.score).toBe(8.5));
    expect(result.current.data).toMatchObject({
      hasEvaluatorPassed: true,
      scoreByAxis: { temporalIdentity: 9 },
      nextPrompt: "Hold identity"
    });
    expect(mocks.cloudMetrics).not.toHaveBeenCalled();
  });
  it("keeps cloud metrics on the existing cloud API", async () => {
    mocks.findMedia.mockResolvedValue(null);
    mocks.cloudAvailable.mockReturnValue(true);
    mocks.cloudMetrics.mockResolvedValue({ status: "COMPLETED", score: 7 });
    const { result } = render();
    await waitFor(() => expect(result.current.data?.score).toBe(7));
    expect(mocks.localMetrics).not.toHaveBeenCalled();
  });
  it("does not send local sheet IDs to either video scoring or the cloud", async () => {
    mocks.findMedia.mockResolvedValue({
      kind: "sheet-image",
      projectId: "local"
    });
    mocks.cloudAvailable.mockReturnValue(true);
    render("image");
    await waitFor(() => expect(mocks.findMedia).toHaveBeenCalled());
    expect(mocks.localMetrics).not.toHaveBeenCalled();
    expect(mocks.cloudMetrics).not.toHaveBeenCalled();
  });
});
