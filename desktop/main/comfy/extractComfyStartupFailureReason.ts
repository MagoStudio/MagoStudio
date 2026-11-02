// oxlint-disable-next-line no-control-regex -- terminal colour codes start with the ESC control character
const ANSI_ESCAPE_SEQUENCE = /\u001b\[[0-9;]*[A-Za-z]/g;
const PYTHON_EXCEPTION_LINE =
  /^(?:[A-Za-z_][\w]*\.)*[A-Za-z_]\w*(?:Error|Exception): (.+)$/;
const MINIMUM_WORDS_IN_SENTENCE = 3;
const MAXIMUM_REASON_LENGTH = 300;

const readsAsSentence = (reason: string) =>
  reason.length <= MAXIMUM_REASON_LENGTH &&
  reason.split(/\s+/).filter((word) => /[A-Za-z]{2}/.test(word)).length >=
    MINIMUM_WORDS_IN_SENTENCE;

export const extractComfyStartupFailureReason = (
  comfyOutput: string
): string | null => {
  const lines = comfyOutput
    .replace(ANSI_ESCAPE_SEQUENCE, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const finalExceptionLine = [...lines]
    .reverse()
    .find((line) => PYTHON_EXCEPTION_LINE.test(line));
  const reason = finalExceptionLine
    ? PYTHON_EXCEPTION_LINE.exec(finalExceptionLine)?.[1]?.trim()
    : undefined;
  return reason && readsAsSentence(reason) ? reason : null;
};
