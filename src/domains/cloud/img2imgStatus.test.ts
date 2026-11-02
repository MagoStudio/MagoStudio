import { describe, expect, it } from "vitest";

import { parseImg2ImgStatus, toImg2ImgJobStatus } from "./img2imgStatus";

describe("parseImg2ImgStatus", () => {
  it("reads status, output URL and progress off the response", () => {
    expect(
      parseImg2ImgStatus({
        render_status: "success",
        output_url: "https://bucket.s3.amazonaws.com/out.png?sig=1",
        progress: 1.0
      })
    ).toEqual({
      status: "success",
      outputUrl: "https://bucket.s3.amazonaws.com/out.png?sig=1",
      progressPercent: 100,
      failureReason: null
    });
  });

  it("scales the 0-1 progress fraction prod sends to a percentage", () => {
    expect(parseImg2ImgStatus({ progress: 0.5 }).progressPercent).toBe(50);
    expect(parseImg2ImgStatus({ progress: 0 }).progressPercent).toBe(0);
    expect(parseImg2ImgStatus({ progress: 0.555 }).progressPercent).toBe(56);
    expect(parseImg2ImgStatus({ progress: 1.5 }).progressPercent).toBe(100);
    expect(parseImg2ImgStatus({ progress: "0.5" }).progressPercent).toBeNull();
  });

  it("copes with a missing or malformed response", () => {
    expect(parseImg2ImgStatus(null)).toEqual({
      status: "",
      outputUrl: null,
      progressPercent: null,
      failureReason: null
    });
    expect(parseImg2ImgStatus({})).toEqual({
      status: "",
      outputUrl: null,
      progressPercent: null,
      failureReason: null
    });
  });

  it("treats an empty output_url as absent rather than a real URL", () => {
    expect(parseImg2ImgStatus({ output_url: "" }).outputUrl).toBeNull();
  });

  it("reads the failure reason from the top level or from data", () => {
    expect(
      parseImg2ImgStatus({ error_message: "Content policy violation" })
        .failureReason
    ).toBe("Content policy violation");
    expect(
      parseImg2ImgStatus({
        data: { error_message: "The render took too long and was stopped." }
      }).failureReason
    ).toBe("The render took too long and was stopped.");
    expect(
      parseImg2ImgStatus({ error_message: "  " }).failureReason
    ).toBeNull();
  });
});

describe("toImg2ImgJobStatus", () => {
  it("maps every status the backend's Img2ImgRenderStatus enum defines", () => {
    expect(toImg2ImgJobStatus("success")).toBe("SUCCESS");
    expect(toImg2ImgJobStatus("failed")).toBe("FAILED");
    expect(toImg2ImgJobStatus("timeout")).toBe("FAILED");
    expect(toImg2ImgJobStatus("cancelled")).toBe("CANCELLED");
    expect(toImg2ImgJobStatus("started")).toBe("INPROGRESS");
    expect(toImg2ImgJobStatus("running")).toBe("INPROGRESS");
    expect(toImg2ImgJobStatus("uploading")).toBe("INPROGRESS");
    expect(toImg2ImgJobStatus("not-started")).toBe("INQUEUE");
    expect(toImg2ImgJobStatus("queued")).toBe("INQUEUE");
    expect(toImg2ImgJobStatus("created")).toBe("INQUEUE");
  });

  it("fails on every terminal failure status prod reports", () => {
    expect(toImg2ImgJobStatus("failed")).toBe("FAILED");
    expect(toImg2ImgJobStatus("timeout")).toBe("FAILED");
    expect(toImg2ImgJobStatus("error")).toBe("FAILED");
    expect(toImg2ImgJobStatus("not_found")).toBe("FAILED");
    expect(toImg2ImgJobStatus("cancelled")).toBe("CANCELLED");
    expect(toImg2ImgJobStatus("NOT_FOUND")).toBe("FAILED");
    expect(toImg2ImgJobStatus("Error")).toBe("FAILED");
  });

  it("is case-insensitive, since the server's casing is not guaranteed", () => {
    expect(toImg2ImgJobStatus("SUCCESS")).toBe("SUCCESS");
    expect(toImg2ImgJobStatus("Failed")).toBe("FAILED");
  });

  it("treats an unrecognised status as still queued, never as finished", () => {
    expect(toImg2ImgJobStatus("something-new")).toBe("INQUEUE");
    expect(toImg2ImgJobStatus("")).toBe("INQUEUE");
  });
});
