import { AxiosError, AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { readValidationErrorMessage } from "./readValidationErrorMessage";

const rejection = (status: number, data: unknown): AxiosError => {
  const error = new AxiosError("rejected");
  error.response = { status, data } as AxiosResponse;
  return error;
};

describe("readValidationErrorMessage", () => {
  it("returns the cap the backend named", () => {
    const message = readValidationErrorMessage(
      rejection(422, { message: "A shot may tag at most 12 characters (13)" })
    );

    expect(message).toBe("A shot may tag at most 12 characters (13)");
  });

  it("ignores a failure that is not a rejected edit", () => {
    expect(
      readValidationErrorMessage(rejection(500, { message: "boom" }))
    ).toBe(null);
  });

  it("ignores a rejection with no usable message", () => {
    expect(readValidationErrorMessage(rejection(422, {}))).toBe(null);
    expect(readValidationErrorMessage(rejection(422, { message: "  " }))).toBe(
      null
    );
    expect(readValidationErrorMessage(rejection(422, "plain text"))).toBe(null);
  });

  it("ignores an error that never reached the backend", () => {
    expect(readValidationErrorMessage(new Error("offline"))).toBe(null);
    expect(readValidationErrorMessage(undefined)).toBe(null);
  });
});
