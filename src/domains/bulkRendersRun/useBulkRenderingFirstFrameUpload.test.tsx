import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { seedance2Model } from "@models/video/seedance2Model";
import { BulkRenderingDraftState, bulkRenderingFlowAtom } from "@store/atoms";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBulkRenderingFirstFrameUpload } from "./useBulkRenderingFirstFrameUpload";

vi.mock("@domains/asset/useUploadReferenceImage", () => ({
  useUploadReferenceImage: vi.fn()
}));

vi.mock("@domains/project/useSelectedProjectId", () => ({
  useSelectedProjectId: () => "project-1"
}));

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@utils")>();
  return {
    ...actual,
    getImageDimensions: vi.fn().mockResolvedValue({ width: 1000, height: 1000 })
  };
});

interface UploadCall {
  file: File;
  signal: AbortSignal | undefined;
  onProgress: ((progressPercent: number) => void) | undefined;
  resolve: (assetId: string | undefined) => void;
  reject: (error: unknown) => void;
}

let uploadCalls: UploadCall[];

const buildFile = (name: string) =>
  new File(["content"], name, {
    type: "image/png"
  });

const buildDraftFlowState = (): BulkRenderingDraftState => ({
  view: "draft",
  selectedShotIds: new Set(["shot-1", "shot-2"]),
  firstFrameSource: "uploaded",
  uploadedFirstFrameAssetIdByShotId: {},
  imagePromptByShotId: {},
  videoPromptByShotId: {},
  imageReferenceAssetIdsByShotId: {},
  imageModelByShotId: {},
  imageSourceFrameByShotId: {},
  videoSettingsByShotId: {},
  imageSettingByShotId: {},
  masterSettings: {
    imageSettings: {} as Img2ImgType,
    videoSettings: {
      mago_engine: seedance2Model.name,
      prompt: "a valid master prompt"
    },
    videoModel: seedance2Model,
    frameRange: [0, 48],
    isFullFrameRangePresetSelected: false
  }
});

const SHOTS = [
  { id: "shot-1", name: "shot_1" },
  { id: "shot-2", name: "shot_2" }
];

const renderUpload = () => {
  const store = createStore();
  store.set(bulkRenderingFlowAtom, buildDraftFlowState());
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(
    () => useBulkRenderingFirstFrameUpload({ shots: SHOTS }),
    { wrapper }
  );
  return { result, store };
};

const findItemByFileName = (
  items: ReturnType<typeof renderUpload>["result"]["current"]["items"],
  fileName: string
) => items.find((item) => item.fileName === fileName);

beforeEach(() => {
  uploadCalls = [];
  vi.mocked(useUploadReferenceImage).mockReturnValue({
    mutateAsync: vi.fn(
      ({
        file,
        signal,
        onProgress
      }: {
        file: File;
        signal?: AbortSignal;
        onProgress?: (progressPercent: number) => void;
      }) =>
        new Promise<string | undefined>((resolve, reject) => {
          uploadCalls.push({ file, signal, onProgress, resolve, reject });
        })
    ),
    isPending: false,
    uploadProgress: 0,
    error: null
  });
});

describe("useBulkRenderingFirstFrameUpload", () => {
  it("never queues a file of an unaccepted type, even if the caller did not pre-filter", () => {
    const { result } = renderUpload();

    act(() =>
      result.current.startUpload([
        new File(["<svg/>"], "shot_1.svg", { type: "image/svg+xml" })
      ])
    );

    expect(uploadCalls).toHaveLength(0);
    expect(result.current.items).toHaveLength(0);
  });

  it("aborts the in-flight upload on cancelAll and never links the Shot it was uploading for", async () => {
    const { result, store } = renderUpload();

    act(() => result.current.startUpload([buildFile("shot_1.jpg")]));

    await waitFor(() => expect(uploadCalls).toHaveLength(1));
    expect(
      findItemByFileName(result.current.items, "shot_1.jpg")?.status.kind
    ).toBe("uploading");

    act(() => result.current.cancelAll());

    expect(uploadCalls[0].signal?.aborted).toBe(true);

    await act(async () => {
      uploadCalls[0].reject(new DOMException("Upload aborted", "AbortError"));
      await Promise.resolve();
    });

    expect(result.current.items).toHaveLength(0);
    expect(
      store.get(bulkRenderingFlowAtom) as BulkRenderingDraftState
    ).toMatchObject({
      uploadedFirstFrameAssetIdByShotId: {}
    });
  });

  it("aborts and removes only the dismissed row, letting the rest of the batch continue", async () => {
    const { result } = renderUpload();

    act(() =>
      result.current.startUpload([
        buildFile("shot_1.jpg"),
        buildFile("shot_2.jpg")
      ])
    );

    await waitFor(() => expect(uploadCalls).toHaveLength(1));
    const uploadingItem = findItemByFileName(
      result.current.items,
      "shot_1.jpg"
    );
    expect(uploadingItem?.status.kind).toBe("uploading");

    act(() => result.current.dismissItem(uploadingItem!.id));

    expect(uploadCalls[0].signal?.aborted).toBe(true);
    expect(
      findItemByFileName(result.current.items, "shot_1.jpg")
    ).toBeUndefined();

    await act(async () => {
      uploadCalls[0].reject(new DOMException("Upload aborted", "AbortError"));
      await Promise.resolve();
    });

    await waitFor(() => expect(uploadCalls).toHaveLength(2));
    expect(
      findItemByFileName(result.current.items, "shot_2.jpg")?.status.kind
    ).toBe("uploading");
  });

  it("supersedes a running batch cleanly when a second batch is dropped, ignoring the stale batch's late resolution", async () => {
    const { result, store } = renderUpload();

    act(() => result.current.startUpload([buildFile("unrelated.jpg")]));
    await waitFor(() => expect(uploadCalls).toHaveLength(1));
    expect(
      findItemByFileName(result.current.items, "unrelated.jpg")?.status.kind
    ).toBe("uploading");

    act(() => result.current.startUpload([buildFile("shot_1.jpg")]));

    expect(uploadCalls[0].signal?.aborted).toBe(true);
    expect(
      findItemByFileName(result.current.items, "unrelated.jpg")
    ).toBeUndefined();

    await waitFor(() => expect(uploadCalls).toHaveLength(2));
    expect(
      findItemByFileName(result.current.items, "shot_1.jpg")?.status.kind
    ).toBe("uploading");

    await act(async () => {
      uploadCalls[0].onProgress?.(42);
      uploadCalls[0].resolve("asset-from-superseded-batch");
      await Promise.resolve();
    });

    expect(
      findItemByFileName(result.current.items, "shot_1.jpg")?.status
    ).toMatchObject({ kind: "uploading", progressPercent: 0 });
    expect(
      (store.get(bulkRenderingFlowAtom) as BulkRenderingDraftState)
        .uploadedFirstFrameAssetIdByShotId
    ).toEqual({});

    await act(async () => {
      uploadCalls[1].resolve("asset-1");
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(
        findItemByFileName(result.current.items, "shot_1.jpg")?.status.kind
      ).toBe("linked")
    );
    expect(
      (store.get(bulkRenderingFlowAtom) as BulkRenderingDraftState)
        .uploadedFirstFrameAssetIdByShotId
    ).toEqual({ "shot-1": "asset-1" });
  });
});
