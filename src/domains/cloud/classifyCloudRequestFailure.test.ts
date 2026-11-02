import { describe, expect, it } from "vitest";

import { classifyCloudRequestFailure } from "./classifyCloudRequestFailure";

const httpError = (status: number, data: unknown) =>
  Object.assign(new Error(`HTTP ${status}`), { response: { status, data } });

describe("classifyCloudRequestFailure", () => {
  it("treats an error with no response as transient", () => {
    expect(classifyCloudRequestFailure(new Error("network down"))).toEqual({
      kind: "transient"
    });
    expect(classifyCloudRequestFailure(undefined)).toEqual({
      kind: "transient"
    });
  });

  it("treats auth, rate-limit and gateway statuses as transient", () => {
    for (const status of [401, 429, 502, 503, 504]) {
      expect(classifyCloudRequestFailure(httpError(status, {})).kind).toBe(
        "transient"
      );
    }
  });

  it("reports any other error status as a rejection with the backend reason", () => {
    expect(
      classifyCloudRequestFailure(
        httpError(422, { error: { message: "corrupt video" } })
      )
    ).toEqual({ kind: "rejected", httpStatus: 422, reason: "corrupt video" });
    expect(
      classifyCloudRequestFailure(httpError(500, { error: "internal" }))
    ).toEqual({ kind: "rejected", httpStatus: 500, reason: "internal" });
  });

  it("leaves the reason empty when the backend gave none", () => {
    expect(classifyCloudRequestFailure(httpError(404, {}))).toEqual({
      kind: "rejected",
      httpStatus: 404,
      reason: ""
    });
  });
});
