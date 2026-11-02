import { Img2ImgSettings } from "@models/img2img/types";
import { VideoSettings } from "@models/video/types";
import { areRenderSettingsErrorsRevealedAtom } from "@store/atoms/areRenderSettingsErrorsRevealedAtom";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";

import { getInlineFieldError } from "../utils/getInlineFieldError";
import { resolveVideoModelOwningSettings } from "../utils/resolveVideoModelOwningSettings";

/**
 * The error a settings field should be showing right now, or undefined.
 *
 * Errors stay hidden until the user presses a blocked Generate, so a panel the
 * user has not finished filling in does not greet them in red. Once revealed,
 * each field answers for itself, so fixing one clears its own red while the
 * others stay.
 */
export const useRenderSettingFieldError = (
  name: string,
  allValues: Img2ImgSettings | VideoSettings | undefined
): string | undefined => {
  const areErrorsRevealed = useAtomValue(areRenderSettingsErrorsRevealedAtom);
  const { sourcesAtom } = useRenderSettingsAtoms();
  const sources = useAtomValue(sourcesAtom);
  const modelOwningTheseSettings = resolveVideoModelOwningSettings(allValues);

  if (!areErrorsRevealed || !modelOwningTheseSettings) return undefined;
  return getInlineFieldError(
    modelOwningTheseSettings,
    allValues,
    name,
    sources
  );
};
