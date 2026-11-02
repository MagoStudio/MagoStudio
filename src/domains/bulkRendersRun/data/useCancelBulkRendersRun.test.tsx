import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useCancelBulkRendersRun } from "./useCancelBulkRendersRun";

const postBulkRendersRunCancel = vi.fn();

vi.mock("../api/postBulkRendersRunCancel", () => ({
  postBulkRendersRunCancel: (bulkRunId: string) =>
    postBulkRendersRunCancel(bulkRunId)
}));

const BULK_RUN_ID = "run-1";
const PROJECT_ID = "project-1";

const axiosErrorWithStatus = (
  status: number,
  data: unknown = {}
): AxiosError => {
  const error = new AxiosError("request failed");
  error.response = {
    status,
    statusText: "",
    data,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() }
  };
  return error;
};

const ALREADY_TERMINAL_RESPONSE_BODY = {
  message: "Cannot cancel plan in COMPLETED state"
};

const renderWithClient = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const refetchSpy = vi
    .spyOn(queryClient, "refetchQueries")
    .mockResolvedValue();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCancelBulkRendersRun(), { wrapper });
  return { result, invalidateSpy, refetchSpy };
};

describe("useCancelBulkRendersRun", () => {
  it("invalidates the run's progress, steps and both list keys on a successful cancel", async () => {
    postBulkRendersRunCancel.mockResolvedValueOnce(undefined);
    const { result, invalidateSpy } = renderWithClient();

    await act(() =>
      result.current.mutateAsync({
        bulkRunId: BULK_RUN_ID,
        projectId: PROJECT_ID
      })
    );

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([options]) => options?.queryKey
    );

    expect(invalidatedKeys).toContainEqual(
      queryKeys.bulkRendersRunProgress.byRunId(BULK_RUN_ID)
    );
    expect(invalidatedKeys).toContainEqual(
      queryKeys.bulkRendersRunSteps.byRunId(BULK_RUN_ID)
    );
    expect(invalidatedKeys).toContainEqual(
      queryKeys.bulkRendersRuns.everyProject()
    );
    expect(invalidatedKeys).toContainEqual(
      queryKeys.bulkRendersRuns.byProjectId(PROJECT_ID)
    );
  });

  it("absorbs a 400 naming a terminal state, refetching its progress, refreshing the lists, and surfacing no error", async () => {
    postBulkRendersRunCancel.mockRejectedValueOnce(
      axiosErrorWithStatus(400, ALREADY_TERMINAL_RESPONSE_BODY)
    );
    const { result, refetchSpy, invalidateSpy } = renderWithClient();

    await act(() =>
      result.current.mutateAsync({
        bulkRunId: BULK_RUN_ID,
        projectId: PROJECT_ID
      })
    );

    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(refetchSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.bulkRendersRunProgress.byRunId(BULK_RUN_ID)
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.bulkRendersRuns.everyProject()
    });
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: queryKeys.bulkRendersRunSteps.byRunId(BULK_RUN_ID)
    });
  });

  it.each(["RUNNING", "PENDING", "PAUSED"])(
    "surfaces a 400 naming the non-terminal state %s as a mutation error, because the cancel was refused rather than redundant",
    async (refusedStatus) => {
      postBulkRendersRunCancel.mockRejectedValueOnce(
        axiosErrorWithStatus(400, {
          message: `Cannot cancel plan in ${refusedStatus} state`
        })
      );
      const { result } = renderWithClient();

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            bulkRunId: BULK_RUN_ID,
            projectId: PROJECT_ID
          })
        ).rejects.toThrow();
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    }
  );

  it("surfaces a 400 whose body does not match the already-terminal message as a mutation error", async () => {
    postBulkRendersRunCancel.mockRejectedValueOnce(
      axiosErrorWithStatus(400, { message: "Unauthorized" })
    );
    const { result } = renderWithClient();

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          bulkRunId: BULK_RUN_ID,
          projectId: PROJECT_ID
        })
      ).rejects.toThrow();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("surfaces any other failure as a mutation error", async () => {
    postBulkRendersRunCancel.mockRejectedValueOnce(axiosErrorWithStatus(500));
    const { result } = renderWithClient();

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          bulkRunId: BULK_RUN_ID,
          projectId: PROJECT_ID
        })
      ).rejects.toThrow();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
