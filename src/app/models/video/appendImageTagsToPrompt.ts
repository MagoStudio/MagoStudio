export const appendImageTagsToPrompt = (
  imageIds: string[],
  currentPrompt: string
): string | undefined => {
  let newPrompt = currentPrompt;
  imageIds.forEach((imageId, index) => {
    const tag = `@Image${index + 1}`;
    if (imageId && !currentPrompt.toLowerCase().includes(tag.toLowerCase())) {
      newPrompt = newPrompt.trim() + ` ${tag}`;
    }
  });
  return newPrompt !== currentPrompt ? newPrompt.trim() : undefined;
};
