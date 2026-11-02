import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { isCloudResourceAlreadyGoneError } from "./isCloudResourceAlreadyGoneError";

const axiosErrorWithStatus = (status: number) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {}
  });

describe("isCloudResourceAlreadyGoneError", () => {
  it("treats a 404 from the backend as already gone", () => {
    expect(isCloudResourceAlreadyGoneError(axiosErrorWithStatus(404))).toBe(
      true
    );
  });

  it("does not treat other backend failures as already gone", () => {
    expect(isCloudResourceAlreadyGoneError(axiosErrorWithStatus(500))).toBe(
      false
    );
    expect(isCloudResourceAlreadyGoneError(new Error("offline"))).toBe(false);
  });
});
