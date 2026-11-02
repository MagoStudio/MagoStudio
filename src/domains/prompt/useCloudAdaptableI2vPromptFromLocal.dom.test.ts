import { VideoEngine } from "@models/video/types";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCloudAdaptableI2vPromptFromLocal } from "./useCloudAdaptableI2vPromptFromLocal";

const pending = vi.hoisted(() => ({
  resolvingSource: false,
  mirroringReferences: false,
  adaptingOnCloud: false
}));

const cloud = vi.hoisted(() => ({
  resolveSourceVideoContext: vi.fn(),
  mirrorReferences: vi.fn(),
  adaptOnCloud: vi.fn(),
  markCloudAssetLinkStale: vi.fn(async (_cloudLinkLocalId: string) => {}),
  rewritePrompt: undefined as
    | undefined
    | ((prompt: string | undefined) => Promise<unknown>)
}));

vi.mock("./api/markCloudAssetLinkStale", () => ({
  markCloudAssetLinkStale: cloud.markCloudAssetLinkStale
}));

vi.mock("@domains/cloud/useCloudSyncProgressToast", () => ({
  useCloudSyncProgressToast: () => ({
    onProgress: vi.fn(),
    dismiss: vi.fn()
  })
}));

vi.mock("./data/useResolveMirroredSourceVideoContext", () => ({
  useResolveMirroredSourceVideoContext: () => ({
    mutateAsync: cloud.resolveSourceVideoContext,
    isPending: pending.resolvingSource
  })
}));

vi.mock("./data/useMirrorAdaptPromptReferencesToCloud", () => ({
  useMirrorAdaptPromptReferencesToCloud: () => ({
    mutateAsync: cloud.mirrorReferences,
    isPending: pending.mirroringReferences
  })
}));

vi.mock("./data/usePostAdaptI2vPrompt", () => ({
  usePostAdaptI2vPrompt: () => ({
    mutateAsync: cloud.adaptOnCloud,
    isPending: pending.adaptingOnCloud
  })
}));

vi.mock("./useUndoablePromptRewrite", () => ({
  useUndoablePromptRewrite: (options: {
    rewritePrompt: (prompt: string | undefined) => Promise<unknown>;
  }) => {
    cloud.rewritePrompt = options.rewritePrompt;
    return {
      rewritePrompt: vi.fn(),
      undoRewritePrompt: vi.fn(),
      canUndoRewritePrompt: false
    };
  }
}));

const renderSubject = () =>
  renderHook(() =>
    useCloudAdaptableI2vPromptFromLocal({
      value: "a prompt",
      onChange: vi.fn(),
      sourceVideoTrackId: "track-1",
      referenceImageAssetIds: [],
      cloudEngine: VideoEngine.minimax_reference
    })
  );

describe("useCloudAdaptableI2vPromptFromLocal", () => {
  beforeEach(() => {
    pending.resolvingSource = false;
    pending.mirroringReferences = false;
    pending.adaptingOnCloud = false;
    vi.clearAllMocks();
  });

  it.each([
    "resolvingSource",
    "mirroringReferences",
    "adaptingOnCloud"
  ] as const)("stays busy while %s is pending", (stage) => {
    pending[stage] = true;

    const { result } = renderSubject();

    expect(result.current.isAdaptingPrompt).toBe(true);
  });

  it("is idle when every cloud preparation stage is idle", () => {
    const { result } = renderSubject();

    expect(result.current.isAdaptingPrompt).toBe(false);
  });

  it("marks the shot's own cloud source link stale when the source video went missing", async () => {
    const missingCloudAssetId = "11111111-1111-1111-1111-111111111111";
    const sourceVideoContext = {
      localAssetId: "local-source",
      cloudSourceVideoLinkLocalId: "local-source#shot-shot-1#trim-full",
      cloudAssetId: missingCloudAssetId,
      cloudProjectId: "cloud-project"
    };
    cloud.resolveSourceVideoContext.mockResolvedValue(sourceVideoContext);
    cloud.mirrorReferences.mockResolvedValue([
      { localAssetId: "local-source", cloudAssetId: missingCloudAssetId }
    ]);
    cloud.adaptOnCloud
      .mockRejectedValueOnce(
        new Error(`reference asset ${missingCloudAssetId} not found`)
      )
      .mockResolvedValueOnce({ prompt: "adapted" });
    renderSubject();

    await cloud.rewritePrompt?.("a prompt");

    expect(cloud.markCloudAssetLinkStale).toHaveBeenCalledWith(
      "local-source#shot-shot-1#trim-full"
    );
    expect(cloud.resolveSourceVideoContext).toHaveBeenCalledTimes(2);
  });
});
