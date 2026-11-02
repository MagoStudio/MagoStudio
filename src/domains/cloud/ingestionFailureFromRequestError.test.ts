import { describe, expect, it } from "vitest";

import { ingestionFailureFromRequestError } from "./ingestionFailureFromRequestError";

const requestErrorWith = (status: number, data: unknown) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data }
  });

describe("ingestionFailureFromRequestError", () => {
  it("reads the backend's reason out of a 422 ingestion failure", () => {
    expect(
      ingestionFailureFromRequestError(
        requestErrorWith(422, { error: { message: "Unsupported codec" } })
      )
    ).toBe("Unsupported codec");
  });

  it("still names an ingestion failure when the 422 carries no reason", () => {
    expect(ingestionFailureFromRequestError(requestErrorWith(422, {}))).toBe(
      "Cloud ingestion failed for this video"
    );
  });

  it("leaves every other request failure alone", () => {
    expect(
      ingestionFailureFromRequestError(
        requestErrorWith(500, { error: "internal server error" })
      )
    ).toBeNull();
    expect(ingestionFailureFromRequestError(new Error("Network Error"))).toBe(
      null
    );
    expect(ingestionFailureFromRequestError(null)).toBeNull();
  });
});
