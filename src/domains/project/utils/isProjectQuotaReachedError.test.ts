import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { isProjectQuotaReachedError } from "./isProjectQuotaReachedError";

const axiosErrorWithStatus = (status: number) =>
  new AxiosError(
    `Request failed with status code ${status}`,
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status,
      statusText: "",
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders() }
    }
  );

describe("isProjectQuotaReachedError", () => {
  it("recognises the backend's 429 on project creation", () => {
    expect(isProjectQuotaReachedError(axiosErrorWithStatus(429))).toBe(true);
  });

  it("ignores other failures", () => {
    expect(isProjectQuotaReachedError(axiosErrorWithStatus(500))).toBe(false);
    expect(
      isProjectQuotaReachedError(new Error("Mago Cloud is not available"))
    ).toBe(false);
    expect(isProjectQuotaReachedError(undefined)).toBe(false);
  });
});
