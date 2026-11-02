import { AxiosError, AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { readProjectSettingsRejectionMessage } from "./readProjectSettingsRejectionMessage";

const rejection = (status: number, data: unknown): AxiosError => {
  const error = new AxiosError("rejected");
  error.response = { status, data } as AxiosResponse;
  return error;
};

describe("readProjectSettingsRejectionMessage", () => {
  it("returns the reason the backend gave", () => {
    const message = readProjectSettingsRejectionMessage(
      rejection(400, {
        message: "settings.visual_style must be at most 8000 characters"
      })
    );

    expect(message).toBe(
      "settings.visual_style must be at most 8000 characters"
    );
  });

  it("ignores a failure that is not a rejected setting", () => {
    expect(
      readProjectSettingsRejectionMessage(rejection(500, { message: "boom" }))
    ).toBe(null);
  });

  it("ignores a rejection with no usable message", () => {
    expect(readProjectSettingsRejectionMessage(rejection(400, {}))).toBe(null);
    expect(
      readProjectSettingsRejectionMessage(rejection(400, { message: "  " }))
    ).toBe(null);
    expect(
      readProjectSettingsRejectionMessage(rejection(400, "plain text"))
    ).toBe(null);
  });

  it("ignores an error that never reached the backend", () => {
    expect(readProjectSettingsRejectionMessage(new Error("offline"))).toBe(
      null
    );
    expect(readProjectSettingsRejectionMessage(undefined)).toBe(null);
  });
});
