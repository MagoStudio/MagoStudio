export const resolveSheetRenderPrompt = ({
  prompt,
  description,
  token
}: {
  prompt: string | null | undefined;
  description: string | null | undefined;
  token: string;
}): string => prompt?.trim() || description?.trim() || token;
