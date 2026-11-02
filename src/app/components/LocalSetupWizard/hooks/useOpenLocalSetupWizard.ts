import { localSetupWizardOpenAtom } from "@store/atoms/localSetupWizardOpenAtom";
import { useSetAtom } from "jotai";

import {
  type LocalSetupOpenRequest,
  OPEN_LOCAL_SETUP_EVENT
} from "../localSetupWizardHandoff";

export const useOpenLocalSetupWizard = () => {
  const setLocalSetupWizardOpen = useSetAtom(localSetupWizardOpenAtom);
  return (openRequest?: LocalSetupOpenRequest) => {
    setLocalSetupWizardOpen(true);
    window.dispatchEvent(
      new CustomEvent(OPEN_LOCAL_SETUP_EVENT, { detail: openRequest })
    );
  };
};
