import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { findMissingReferenceCloudAssetId } from "./findMissingReferenceCloudAssetId";

const MISSING_ID = "2e8d0b59-376e-4c3c-92de-8587f33401a1";

const backendError = (body: unknown) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    data: body,
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: { headers: new AxiosHeaders() }
  });

describe("findMissingReferenceCloudAssetId", () => {
  it("reads the missing id from the backend's error body", () => {
    expect(
      findMissingReferenceCloudAssetId(
        backendError({ error: `reference asset ${MISSING_ID} not found` })
      )
    ).toBe(MISSING_ID);
  });

  it("returns null for the access error, which names no asset", () => {
    expect(
      findMissingReferenceCloudAssetId(
        backendError({ error: "reference asset not found or inaccessible" })
      )
    ).toBeNull();
  });

  it("returns null for unrelated failures", () => {
    expect(
      findMissingReferenceCloudAssetId(new Error("Network Error"))
    ).toBeNull();
    expect(findMissingReferenceCloudAssetId(undefined)).toBeNull();
  });
});
