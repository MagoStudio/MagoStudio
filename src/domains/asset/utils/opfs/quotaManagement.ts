import { opfsClear } from "./index";

export async function handleQuotaExceeded(): Promise<void> {
  try {
    await opfsClear("filmstrip");
  } catch (error) {
    console.warn(
      "Failed to clear filmstrip cache after quota exceeded:",
      error
    );
  }
}

export function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return (
      error.name === "QuotaExceededError" ||
      error.code === DOMException.QUOTA_EXCEEDED_ERR
    );
  }
  if (error instanceof Error) {
    return error.message.toLowerCase().includes("quota");
  }
  return false;
}
