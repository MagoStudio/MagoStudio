import { randomUUID } from "node:crypto";

import { ipcMain, type WebContents } from "electron";

import { IPC_CHANNELS } from "../../shared/contracts";
import type {
  RunCloudTextModel,
  TextModelResponse
} from "../../shared/textModelRequest";

import { requireTrustedSender } from "./trustedSender";

const REQUEST_TIMEOUT_MS = 360_000;
const CANCELLATION_INTERVAL_MS = 250;

/** Auth stays in the renderer. This bridge carries only text inputs and results. */
export class TextModelBridge {
  private renderer?: WebContents;
  private pending = new Map<
    string,
    {
      sender: WebContents;
      finish: (response: TextModelResponse) => void;
    }
  >();

  register(): void {
    ipcMain.on(IPC_CHANNELS.textModelReady, (event) => {
      requireTrustedSender(event);
      this.renderer = event.sender;
    });
    ipcMain.on(
      IPC_CHANNELS.textModelResponse,
      (event, response: TextModelResponse) => {
        requireTrustedSender(event);
        if (!response || typeof response.id !== "string") return;
        const pending = this.pending.get(response.id);
        if (pending?.sender === event.sender) pending.finish(response);
      }
    );
  }

  run: RunCloudTextModel = (operation, body, isCancelled) => {
    if (isCancelled?.())
      return Promise.reject(new Error("Text model request cancelled"));
    const renderer = this.renderer;
    if (!renderer || renderer.isDestroyed())
      return Promise.reject(
        new Error(
          "Text model connection is unavailable; reopen the app and retry"
        )
      );
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const finish = (response: TextModelResponse) => {
        clearTimeout(timeout);
        clearInterval(cancellation);
        this.pending.delete(id);
        renderer.removeListener("destroyed", destroyed);
        if (response.error) reject(new Error(response.error));
        else if (
          response.result === null ||
          (response.result &&
            typeof response.result === "object" &&
            !Array.isArray(response.result))
        )
          resolve(response.result);
        else reject(new Error("Invalid text model response"));
      };
      const stop = (error: string) => {
        if (!renderer.isDestroyed())
          renderer.send(IPC_CHANNELS.textModelCancel, id);
        finish({ id, error });
      };
      const destroyed = () =>
        stop("Text model connection closed before the reply finished");
      const timeout = setTimeout(
        () => stop("Text model request timed out"),
        REQUEST_TIMEOUT_MS
      );
      const cancellation = setInterval(() => {
        if (isCancelled?.()) stop("Text model request cancelled");
      }, CANCELLATION_INTERVAL_MS);
      this.pending.set(id, { sender: renderer, finish });
      renderer.once("destroyed", destroyed);
      renderer.send(IPC_CHANNELS.textModelRequest, { id, operation, body });
    });
  };
}
