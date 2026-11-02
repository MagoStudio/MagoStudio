export const useUploadReferenceImage = () => ({
  mutateAsync: () => new Promise<string | undefined>(() => {}),
  isPending: false,
  uploadProgress: 42,
  error: null
});
