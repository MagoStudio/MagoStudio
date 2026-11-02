export interface ComposedAbortSignal {
  signal: AbortSignal;
  release: () => void;
}

export const composeAbortSignals = (
  callerSignal: AbortSignal | undefined,
  timeoutMs: number
): ComposedAbortSignal => {
  const controller = new AbortController();

  const abortWith = (reason: unknown) => {
    if (controller.signal.aborted) return;
    controller.abort(reason);
  };

  const timeoutId = setTimeout(() => {
    abortWith(new DOMException("Video ingestion timed out", "TimeoutError"));
  }, timeoutMs);

  const forwardCallerAbort = () => abortWith(callerSignal?.reason);

  const release = () => {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener("abort", forwardCallerAbort);
  };

  if (callerSignal?.aborted) {
    abortWith(callerSignal.reason);
    clearTimeout(timeoutId);
    return { signal: controller.signal, release };
  }

  callerSignal?.addEventListener("abort", forwardCallerAbort, { once: true });

  return { signal: controller.signal, release };
};

export const isTimeoutAbort = (signal: AbortSignal): boolean =>
  signal.aborted &&
  signal.reason instanceof DOMException &&
  signal.reason.name === "TimeoutError";
