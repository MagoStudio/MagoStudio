import { atom } from "jotai";

import { localSetupWizardCollapsedAtom } from "./localSetupWizardCollapsedAtom";
import { localSetupWizardOpenAtom } from "./localSetupWizardOpenAtom";

export const isLocalSetupPillShownAtom = atom(
  (get) => get(localSetupWizardOpenAtom) && get(localSetupWizardCollapsedAtom)
);
