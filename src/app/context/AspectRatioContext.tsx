import { aspectRatios } from "@config/constants";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { Shot } from "@schemas/shot";
import React, { createContext, useContext, useState } from "react";

type AspectRatioSize = [number, number];

const ASPECT_RATIO_DIMENSIONS_LENGTH = 2;

const defaultAspectRatio: AspectRatioSize = aspectRatios.horizontal;

interface AspectRatioContextProps {
  aspectRatio: AspectRatioSize;
  setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatioSize>>;
  updateFromShot: (shot: Shot | null) => void;
}

const AspectRatioContext = createContext<AspectRatioContextProps | undefined>(
  undefined
);

interface Props {
  children: React.ReactNode;
}

export const AspectRatioProvider: React.FC<Props> = ({ children }) => {
  const [aspectRatio, setAspectRatio] =
    useState<AspectRatioSize>(defaultAspectRatio);

  const updateFromShot = (shot: Shot | null) => {
    const size = getTrackAssetData(shot?.layers?.[0])?.size;
    if (
      Array.isArray(size) &&
      size.length === ASPECT_RATIO_DIMENSIONS_LENGTH &&
      typeof size[0] === "number" &&
      typeof size[1] === "number"
    ) {
      setAspectRatio(size);
    }
  };

  return (
    <AspectRatioContext.Provider
      value={{
        aspectRatio,
        setAspectRatio,
        updateFromShot
      }}
    >
      {children}
    </AspectRatioContext.Provider>
  );
};

export const useAspectRatio = () => {
  const context = useContext(AspectRatioContext);
  if (!context) {
    throw new Error(
      "useAspectRatio must be used within an AspectRatioProvider"
    );
  }
  return context;
};
