import {
  type ToastOptions,
  toastNotificationsAtom
} from "@store/atoms/toastAtom";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

const RANDOM_ID_BASE = 36;
const RANDOM_ID_START = 2;
const RANDOM_ID_LENGTH = 9;

const HINT_TOAST_DURATION = 10;

type ShowToastOptions = Omit<ToastOptions, "id" | "type">;

type ShowErrorToastOptions = {
  message: ToastOptions["message"];
  onRetry?: () => void;
};

export function useToast() {
  const { t } = useTranslation();
  const setToasts = useSetAtom(toastNotificationsAtom);
  const addToast = (options: Omit<ToastOptions, "id">): string => {
    const id = Math.random()
      .toString(RANDOM_ID_BASE)
      .substring(RANDOM_ID_START, RANDOM_ID_LENGTH);
    setToasts((prev) => [
      ...prev,
      {
        ...options,
        id
      }
    ]);
    return id;
  };
  const showToast = (options: ShowToastOptions): string =>
    addToast({
      ...options,
      type: "default"
    });
  const showHintToast = (message: string) => {
    addToast({
      message,
      type: "hint",
      showTimer: false,
      autoDismiss: true,
      duration: HINT_TOAST_DURATION
    });
  };
  const showErrorToast = ({ message, onRetry }: ShowErrorToastOptions) =>
    showToast({
      message,
      showTimer: false,
      autoDismiss: false,
      onSubmitText: t("actions.dismiss.label"),
      invertedSubmitAndCancelColors: true,
      ...(onRetry
        ? { onCancel: onRetry, onCancelText: t("actions.retry.label") }
        : {})
    });
  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((n) => n.id !== id));
  };
  const updateToast = (id: string, patch: Partial<ShowToastOptions>) => {
    setToasts((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch } : n))
    );
  };
  return {
    showToast,
    showHintToast,
    showErrorToast,
    hideToast,
    updateToast
  };
}
