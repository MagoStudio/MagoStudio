import { createContext, useContext, ReactNode, useState } from "react";

interface IsReferenceImageUploadingContextType {
  isReferenceImageUploading: boolean;
  setIsReferenceImageUploading: (isReferenceImageUploading: boolean) => void;
}

const IsReferenceImageUploadingContext = createContext<
  IsReferenceImageUploadingContextType | undefined
>(undefined);

export function IsReferenceImageUploadingProvider({
  children
}: {
  children: ReactNode;
}) {
  const [isReferenceImageUploading, setIsReferenceImageUploading] =
    useState(false);

  const value = {
    isReferenceImageUploading,
    setIsReferenceImageUploading
  };

  return (
    <IsReferenceImageUploadingContext.Provider value={value}>
      {children}
    </IsReferenceImageUploadingContext.Provider>
  );
}

export function useIsReferenceImageUploading() {
  const context = useContext(IsReferenceImageUploadingContext);
  if (context === undefined) {
    throw new Error(
      "useIsReferenceImageUploading must be used within a IsReferenceImageUploadingProvider"
    );
  }
  return context;
}
