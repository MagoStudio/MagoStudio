import { onboardingProgressAtom } from "@store/atoms/onboardingAtom";
import { useAtom } from "jotai";

export const useOnboardingProgress = () => useAtom(onboardingProgressAtom);
