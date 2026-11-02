"use client";

import { useEffect } from "react";

import { runCloudTextModel } from "./runCloudTextModel";

/** Mounted for the desktop session, including offline mode and navigation. */
export const TextModelWorker = () => {
  useEffect(() => {
    const bridge = window.mago?.textModel;
    if (!bridge) return;
    const running = new Map<string, AbortController>();
    const unsubscribe = bridge.onRequest((request) => {
      const controller = new AbortController();
      running.set(request.id, controller);
      void runCloudTextModel(request, controller.signal)
        .then(
          (result) => bridge.respond({ id: request.id, result }),
          (error: unknown) =>
            bridge.respond({
              id: request.id,
              error:
                error instanceof Error
                  ? error.message
                  : "Text model request failed"
            })
        )
        .finally(() => running.delete(request.id));
    });
    const cancel = bridge.onCancel((id) => running.get(id)?.abort());
    bridge.ready();
    return () => {
      unsubscribe();
      cancel();
      for (const controller of running.values()) controller.abort();
    };
  }, []);
  return null;
};
