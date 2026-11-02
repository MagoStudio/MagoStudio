interface HandlePastDueParams {
  createPortalSession: (
    params?: { type?: string },
    options?: {
      onSuccess?: (url: string) => void;
      onError?: (error: unknown) => void;
    }
  ) => void;
  onRedirect?: (url: string) => void;
  onError?: (error: unknown) => void;
}

export const handlePastDuePayment = ({
  createPortalSession,
  onRedirect,
  onError
}: HandlePastDueParams): void => {
  createPortalSession(undefined, {
    onSuccess: (url) => onRedirect?.(url),
    onError: (error) => onError?.(error)
  });
};
