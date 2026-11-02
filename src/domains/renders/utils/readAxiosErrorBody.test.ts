import { describe, expect, it } from "vitest";

import { readAxiosErrorBody } from "./readAxiosErrorBody";

describe("readAxiosErrorBody", () => {
  it("reads the detail field when present", () => {
    expect(readAxiosErrorBody({ detail: "relaxed_daily_limit_exceeded" })).toBe(
      "relaxed_daily_limit_exceeded"
    );
  });

  it("falls back to the error field when detail is absent", () => {
    expect(readAxiosErrorBody({ error: "reference asset not found" })).toBe(
      "reference asset not found"
    );
  });

  it("reads the message field prod sends for refusals", () => {
    expect(readAxiosErrorBody({ message: "Insufficient balance" })).toBe(
      "Insufficient balance"
    );
  });

  it("reads a plain-string body", () => {
    expect(readAxiosErrorBody("Clip not found")).toBe("Clip not found");
  });

  it("ignores an HTML error page", () => {
    expect(readAxiosErrorBody("<html><body>502</body></html>")).toBe("");
  });

  it("prefers detail over error and message when several are present", () => {
    expect(
      readAxiosErrorBody({
        detail: "detail message",
        error: "error message",
        message: "message"
      })
    ).toBe("detail message");
  });

  it("reads a message nested in an error object", () => {
    expect(readAxiosErrorBody({ error: { message: "nested" } })).toBe("nested");
  });

  it("prefers a top-level string over a nested message", () => {
    expect(
      readAxiosErrorBody({ error: { message: "nested" }, message: "top" })
    ).toBe("top");
  });

  it("returns an empty string for non-string fields", () => {
    expect(readAxiosErrorBody({ detail: 404 })).toBe("");
    expect(readAxiosErrorBody({ detail: [{ msg: "x" }] })).toBe("");
  });

  it("returns an empty string for missing or blank data", () => {
    expect(readAxiosErrorBody(undefined)).toBe("");
    expect(readAxiosErrorBody(null)).toBe("");
    expect(readAxiosErrorBody("   ")).toBe("");
  });
});
