import { AxiosError, AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { readUploadRejectionMessage } from "./readUploadRejectionMessage";

const rejection = (status: number, data: unknown): AxiosError => {
  const error = new AxiosError("rejected");
  error.response = { status, data } as AxiosResponse;
  return error;
};

describe("readUploadRejectionMessage", () => {
  it("returns the quota message the backend sent", () => {
    expect(
      readUploadRejectionMessage(
        rejection(429, { message: "Maximum number of uploaded images reached" })
      )
    ).toBe("Maximum number of uploaded images reached");
  });

  it("returns the format message the backend sent under error", () => {
    expect(
      readUploadRejectionMessage(
        rejection(400, { error: "Invalid file extension: use one of jpg" })
      )
    ).toBe("Invalid file extension: use one of jpg");
  });

  it("ignores a failure that was not a refusal", () => {
    expect(
      readUploadRejectionMessage(rejection(500, { message: "boom" }))
    ).toBe(null);
    expect(readUploadRejectionMessage(new Error("network"))).toBe(null);
  });

  it("ignores a refusal with no usable message", () => {
    expect(readUploadRejectionMessage(rejection(400, {}))).toBe(null);
    expect(readUploadRejectionMessage(rejection(400, { error: " " }))).toBe(
      null
    );
  });
});
