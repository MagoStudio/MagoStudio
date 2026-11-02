import {
  useGetSelectedShotIdFromUrl,
  useSetSelectedShotIdFromUrl
} from "./data/useGetSelectedShotIdFromUrl";

export const useSelectedShotId = () => {
  const selectedShotIdFromUrl = useGetSelectedShotIdFromUrl();
  const setSelectedShotIdFromUrl = useSetSelectedShotIdFromUrl();

  const setSelectedShotId = (shotId: string | undefined) => {
    setSelectedShotIdFromUrl(shotId);
  };

  return { selectedShotId: selectedShotIdFromUrl, setSelectedShotId };
};
