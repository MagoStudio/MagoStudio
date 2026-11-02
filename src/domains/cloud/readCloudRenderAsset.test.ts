import { describe, expect, it, vi } from "vitest";

import { readCloudRenderAsset } from "./readCloudRenderAsset";

const apiReturning = (get: () => unknown) => ({
  post: vi.fn(),
  get: vi.fn(async () => get() as never)
});

const httpError = (status: number, data: unknown) =>
  Object.assign(new Error(`HTTP ${status}`), { response: { status, data } });

describe("readCloudRenderAsset", () => {
  it("is ready once the asset carries a download URL", async () => {
    const api = apiReturning(() => ({ s3_url: "https://bucket/out.mp4" }));

    expect(await readCloudRenderAsset(api, "cloud-a")).toEqual({
      kind: "ready",
      url: "https://bucket/out.mp4"
    });
    expect(api.get).toHaveBeenCalledWith("/assets/cloud-a");
  });

  it("is pending on prod's 202 pending body", async () => {
    const api = apiReturning(() => ({ status: "pending" }));

    expect(await readCloudRenderAsset(api, "cloud-a")).toEqual({
      kind: "pending"
    });
  });

  it("fails with the backend reason on an ingestion error", async () => {
    const api = apiReturning(() => {
      throw httpError(422, { error: { message: "no frames decoded" } });
    });

    expect(await readCloudRenderAsset(api, "cloud-a")).toEqual({
      kind: "failed",
      reason: "no frames decoded"
    });
  });

  it("names the status when a 500 carries no reason", async () => {
    const api = apiReturning(() => {
      throw httpError(500, {});
    });

    expect(await readCloudRenderAsset(api, "cloud-a")).toEqual({
      kind: "failed",
      reason: "Mago cloud could not deliver the render (HTTP 500)"
    });
  });

  it("says the render is gone on a 404", async () => {
    const api = apiReturning(() => {
      throw httpError(404, { error: "Asset not found" });
    });

    expect(await readCloudRenderAsset(api, "cloud-a")).toEqual({
      kind: "failed",
      reason: "The cloud render no longer exists in Mago cloud"
    });
  });

  it("is unreachable on a network failure", async () => {
    const api = apiReturning(() => {
      throw new Error("network down");
    });

    expect(await readCloudRenderAsset(api, "cloud-a")).toEqual({
      kind: "unreachable"
    });
  });
});
