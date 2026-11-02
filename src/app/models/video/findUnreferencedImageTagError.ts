export const findUnreferencedImageTagError = (
  prompt: string,
  imageIds: unknown[],
  maxImageSlots: number
): string | null => {
  const promptLower = prompt.toLowerCase();

  for (let index = 0; index < maxImageSlots; index++) {
    const slotNumber = index + 1;
    const isSlotFilled = Boolean(imageIds[index]);
    const isSlotReferenced = promptLower.includes(`@image${slotNumber}`);

    if (isSlotFilled && !isSlotReferenced) {
      return `Add @Image${slotNumber} to your prompt or remove the image`;
    }
  }

  return null;
};
