export const waitForPollTick = (
  ms: number,
  signal: AbortSignal
): Promise<void> =>
  new Promise((resolve) => {
    const settle = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", settle);
      resolve();
    };

    const timeoutId = setTimeout(settle, ms);
    signal.addEventListener("abort", settle, { once: true });
  });
