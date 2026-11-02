import { atom } from "jotai";

type VideosLoading = { [key: string]: boolean };

export const videosLoadingAtom = atom<VideosLoading>({});

export const isAnyVideoLoadingAtom = atom((get) => {
  const videosLoading = get(videosLoadingAtom);
  return Object.values(videosLoading).some((loading) => loading);
});
