const GRADIENT_PLACEHOLDER_FILENAMES = [
  "mesh-01-lime-coral.png",
  "mesh-02-teal-lime.png",
  "mesh-03-rose-sand.png",
  "mesh-04-lavender-periwinkle.png",
  "mesh-05-warning-success.png"
];

const sumCharCodes = (value: string): number => {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total += value.charCodeAt(index);
  }
  return total;
};

export const resolveProjectPreviewUrl = (
  projectId: string,
  previewUrl: string | null | undefined
): string => {
  if (previewUrl) return previewUrl;

  const filenameIndex =
    sumCharCodes(projectId) % GRADIENT_PLACEHOLDER_FILENAMES.length;

  return `/project-gradients/${GRADIENT_PLACEHOLDER_FILENAMES[filenameIndex]!}`;
};
