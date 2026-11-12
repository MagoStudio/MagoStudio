import { rm } from "node:fs/promises";

export const deletePartialDownload = async (destination: string) => {
  const partial = destination + ".mago-part";
  await rm(partial, { force: true });
  await rm(partial + ".json", { force: true });
};
