import { Img2ImgRenderStatus } from "@models/img2img/types";
import { describe, expect, it } from "vitest";

import { toLocalImg2ImgRenderStatus } from "./toLocalImg2ImgRenderStatus";

describe("toLocalImg2ImgRenderStatus", () => {
  it("turns the queue's percent progress into the 0-1 fraction the placeholder draws", () => {
    expect(
      toLocalImg2ImgRenderStatus({ status: "INPROGRESS", progress: 40 })
    ).toMatchObject({
      progress: 0.4,
      render_status: Img2ImgRenderStatus.RUNNING
    });
  });

  it("maps the terminal queue statuses", () => {
    expect(
      toLocalImg2ImgRenderStatus({ status: "FINISHED" }).render_status
    ).toBe(Img2ImgRenderStatus.SUCCESS);
    expect(toLocalImg2ImgRenderStatus({ status: "ERROR" }).render_status).toBe(
      Img2ImgRenderStatus.FAILED
    );
    expect(
      toLocalImg2ImgRenderStatus({ status: "CANCELLED" }).render_status
    ).toBe(Img2ImgRenderStatus.CANCELLED);
  });

  it("treats any other status as queued", () => {
    expect(
      toLocalImg2ImgRenderStatus({ status: "PENDING" }).render_status
    ).toBe(Img2ImgRenderStatus.QUEUED);
  });

  it("passes the render's settings through for reuse", () => {
    const data = { frame: 12, settings: { render_model: "nanobanana_pro" } };
    expect(toLocalImg2ImgRenderStatus({ status: "FINISHED", data }).data).toBe(
      data
    );
  });

  it("reports no progress when the queue has none", () => {
    expect(
      toLocalImg2ImgRenderStatus({ status: "PENDING", progress: "unknown" })
        .progress
    ).toBe(0);
  });
});
