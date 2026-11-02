import { describe, expect, it } from "vitest";

import { parseRenderedVideoMetadata } from "./parseRenderedVideoMetadata";

const streamCopyLog = [
  "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'output.mp4':",
  "  Duration: 00:00:02.33, start: 0.000000, bitrate: 52 kb/s",
  "  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1280x720 [SAR 1:1 DAR 16:9], 49 kb/s, 23.98 fps, 23.98 tbr, 12288 tbn (default)",
  "Stream mapping:",
  "  Stream #0:0 -> #0:0 (copy)",
  "size=N/A time=00:00:02.29 bitrate=N/A speed= 101x"
].join("\r\n");

describe("parseRenderedVideoMetadata", () => {
  it("takes the frame count from the copied packets and the rest from the stream", () => {
    expect(
      parseRenderedVideoMetadata({
        videoPacketCount: 56,
        ffmpegLog: streamCopyLog
      })
    ).toEqual({ frameCount: 56, fps: 23.98, width: 1280, height: 720 });
  });

  it("knows nothing when no video packet was copied", () => {
    expect(
      parseRenderedVideoMetadata({
        videoPacketCount: 0,
        ffmpegLog: "output.mp4: Invalid data found when processing input"
      })
    ).toBeNull();
  });

  it("still gives the frame count when the stream line is unreadable", () => {
    expect(
      parseRenderedVideoMetadata({ videoPacketCount: 12, ffmpegLog: "" })
    ).toEqual({ frameCount: 12, fps: null, width: null, height: null });
  });
});
