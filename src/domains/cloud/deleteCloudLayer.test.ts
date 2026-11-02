import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteCloudLayer } from "./deleteCloudLayer";

const deleteRequest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { delete: deleteRequest }
}));

beforeEach(() => {
  deleteRequest.mockReset();
});

describe("deleteCloudLayer", () => {
  it("deletes the layer by id", async () => {
    deleteRequest.mockResolvedValue({ status: 200 });

    await deleteCloudLayer("cloud-output-layer");

    expect(deleteRequest).toHaveBeenCalledWith("/layers/cloud-output-layer");
  });

  it("propagates a failed delete", async () => {
    deleteRequest.mockRejectedValue(new Error("gone"));

    await expect(deleteCloudLayer("cloud-output-layer")).rejects.toThrow(
      "gone"
    );
  });
});
