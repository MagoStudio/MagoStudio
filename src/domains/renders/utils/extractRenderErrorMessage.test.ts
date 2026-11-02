import axios, { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { extractRenderErrorMessage } from "./extractRenderErrorMessage";
import { INSUFFICIENT_BALANCE_RENDER_MESSAGE } from "./insufficientBalanceRenderMessage";

const makeAxiosError = (data: unknown, status = 400): AxiosError => {
  const error = new AxiosError("Request failed");
  error.response = {
    data,
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() }
  };
  return error;
};

describe("extractRenderErrorMessage", () => {
  it("returns the string detail from a 400 response", () => {
    const error = makeAxiosError({
      detail: "Invalid source 'images': asset not found or inaccessible"
    });
    expect(extractRenderErrorMessage(error)).toBe(
      "Invalid source 'images': asset not found or inaccessible"
    );
  });

  it("returns the message field prod uses for refusals", () => {
    const error = makeAxiosError({ message: "Clip not found" }, 404);
    expect(extractRenderErrorMessage(error)).toBe("Clip not found");
  });

  it("returns a plain-string body", () => {
    const error = makeAxiosError("Invalid render mode");
    expect(extractRenderErrorMessage(error)).toBe("Invalid render mode");
  });

  it("explains a 402 as running out of credits", () => {
    const error = makeAxiosError({ message: "Insufficient balance" }, 402);
    expect(extractRenderErrorMessage(error)).toBe(
      INSUFFICIENT_BALANCE_RENDER_MESSAGE
    );
  });

  it("returns undefined when detail is a non-string object", () => {
    const error = makeAxiosError({ detail: { something: "else" } });
    expect(extractRenderErrorMessage(error)).toBeUndefined();
  });

  it("returns undefined when the response carries no message", () => {
    const error = makeAxiosError({});
    expect(extractRenderErrorMessage(error)).toBeUndefined();
  });

  it("returns undefined for non-axios errors", () => {
    expect(extractRenderErrorMessage(new Error("nope"))).toBeUndefined();
    expect(extractRenderErrorMessage(undefined)).toBeUndefined();
    expect(axios.isAxiosError(new Error("nope"))).toBe(false);
  });
});
