import { mkdir, rename, stat } from "node:fs/promises";
import path from "node:path";

export const swapInNodePack = async ({
  stagedNodePack,
  nodePackDirectory,
  replacedNodePack
}: {
  stagedNodePack: string;
  nodePackDirectory: string;
  replacedNodePack: string;
}): Promise<void> => {
  const hasPreviousNodePack = Boolean(
    await stat(nodePackDirectory).catch(() => null)
  );
  if (hasPreviousNodePack) {
    await mkdir(path.dirname(replacedNodePack), { recursive: true });
    await rename(nodePackDirectory, replacedNodePack);
  }
  try {
    await rename(stagedNodePack, nodePackDirectory);
  } catch (error) {
    if (hasPreviousNodePack) await rename(replacedNodePack, nodePackDirectory);
    throw error;
  }
};
