import { spawn } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

import {
  parseRenderedVideoMetadata,
  RenderedVideoMetadata
} from "./parseRenderedVideoMetadata";

const FFMPEG_PROBE_TIMEOUT_MS = 60_000;
const KEPT_FFMPEG_LOG_LENGTH = 20_000;
const FRAMECRC_HEADER_LINE_PREFIX = "#";
const LINE_BREAK = "\n";

const ffmpegExecutablePath = (): string | null =>
  ffmpegPath ? ffmpegPath.replace("app.asar", "app.asar.unpacked") : null;

const buildPacketListingArgs = (filePath: string): string[] => [
  "-hide_banner",
  "-nostdin",
  "-i",
  filePath,
  "-map",
  "0:v:0",
  "-c",
  "copy",
  "-f",
  "framecrc",
  "-"
];

const createFramecrcPacketLineCounter = () => {
  let packetLineCount = 0;
  let isAtLineStart = true;
  return {
    read: (text: string) => {
      for (const character of text) {
        if (isAtLineStart && character !== FRAMECRC_HEADER_LINE_PREFIX)
          packetLineCount += 1;
        isAtLineStart = character === LINE_BREAK;
      }
    },
    count: () => packetLineCount
  };
};

export const probeRenderedVideoMetadata = (
  filePath: string
): Promise<RenderedVideoMetadata | null> => {
  const executablePath = ffmpegExecutablePath();
  if (!executablePath) return Promise.resolve(null);
  return new Promise((resolve) => {
    const child = spawn(executablePath, buildPacketListingArgs(filePath), {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const packetLineCounter = createFramecrcPacketLineCounter();
    let ffmpegLog = "";
    let settled = false;
    const finish = (exitCode: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const didListEveryPacket = exitCode === 0;
      resolve(
        didListEveryPacket
          ? parseRenderedVideoMetadata({
              videoPacketCount: packetLineCounter.count(),
              ffmpegLog
            })
          : null
      );
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(null);
    }, FFMPEG_PROBE_TIMEOUT_MS);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", packetLineCounter.read);
    child.stderr.on("data", (chunk: Buffer) => {
      ffmpegLog = `${ffmpegLog}${chunk.toString()}`.slice(
        0,
        KEPT_FFMPEG_LOG_LENGTH
      );
    });
    child.once("error", () => finish(null));
    child.once("close", finish);
  });
};
