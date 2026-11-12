const UNLOADABLE_SOURCE_ERROR_NAME = "NotSupportedError";

export const didProviderPreviewFailToLoad = ({
  playRejectionError,
  audioHasMediaError
}: {
  playRejectionError: unknown;
  audioHasMediaError: boolean;
}): boolean =>
  audioHasMediaError ||
  (playRejectionError instanceof Error &&
    playRejectionError.name === UNLOADABLE_SOURCE_ERROR_NAME);
