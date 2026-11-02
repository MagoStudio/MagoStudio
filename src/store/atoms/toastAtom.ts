import { atom } from "jotai";
import { type ReactNode } from "react";

export interface ToastOptions {
  id: string;
  type?: "default" | "hint";
  message: ReactNode;
  onCancel?: () => void;
  onCancelText?: string;
  onClose?: () => void;
  onSubmit?: () => void;
  onSubmitText?: string;
  showTimer?: boolean;
  autoDismiss?: boolean;
  invertedSubmitAndCancelColors?: boolean;
  duration?: number;
}

export const toastNotificationsAtom = atom<ToastOptions[]>([]);
