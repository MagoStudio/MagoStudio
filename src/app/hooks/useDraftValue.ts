import { useState } from "react";

/**
 * A local edit buffer that re-seeds when the saved value changes underneath it.
 *
 * A re-cast rewrites a shot's prompt while the row keeps
 * its timeline id, so a draft seeded once would silently PATCH the old text back over the
 * new one. Adjusting during render is React's documented alternative to an effect here.
 */
export const useDraftValue = (savedValue: string) => {
  const [draftValue, setDraftValue] = useState(savedValue);
  const [seededFrom, setSeededFrom] = useState(savedValue);

  if (seededFrom !== savedValue) {
    setSeededFrom(savedValue);
    setDraftValue(savedValue);
  }

  return {
    draftValue,
    setDraftValue,
    isDraftDirty: draftValue !== savedValue
  };
};
