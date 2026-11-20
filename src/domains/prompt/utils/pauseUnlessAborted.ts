export const pauseUnlessAborted = (
  durationMs: number,
  signal: AbortSignal
): Promise<void> =>
  new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, durationMs);
    signal.addEventListener("abort", abort, { once: true });
  });
