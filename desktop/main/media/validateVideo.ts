import { spawn } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

const VALIDATION_TIMEOUT_MS = 60_000;
const MAX_ERROR_LENGTH = 2000;

export const validateVideo = (filename: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("The video validator is unavailable"));
      return;
    }
    const child = spawn(
      ffmpegPath.replace("app.asar", "app.asar.unpacked"),
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-xerror",
        "-i",
        filename,
        "-map",
        "0:v:0",
        // Decode every frame: copying packets can accept unreadable media data.
        "-f",
        "null",
        "-"
      ],
      { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] }
    );
    let error = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Timed out checking interrupted video"));
    }, VALIDATION_TIMEOUT_MS);
    child.stderr.on("data", (chunk: Buffer) => {
      error = `${error}${chunk.toString()}`.slice(-MAX_ERROR_LENGTH);
    });
    child.once("error", (failure) => {
      clearTimeout(timer);
      reject(failure);
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `The interrupted video is incomplete or unreadable: ${error}`
          )
        );
    });
  });
