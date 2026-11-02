/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { HintToast } from "@components/HintToast";
import { Toast } from "@components/Toast";
import { toastNotificationsAtom } from "@store/atoms/toastAtom";
import { useAtom } from "jotai";
import { useEffect } from "react";

export const ToastPile: React.FC = () => {
  const [notifications, setNotifications] = useAtom(toastNotificationsAtom);

  useEffect(() => {
    if (notifications.length <= 1) return;

    const [newest, ...older] = [...notifications].reverse();
    older.forEach((notification) => {
      notification.onSubmit?.();
    });
    setNotifications([newest]);
  }, [notifications, setNotifications]);

  const current = notifications[notifications.length - 1];

  if (!current) return null;

  const removeCurrentNotification = () => {
    setNotifications((prev) => prev.filter((n) => n.id !== current.id));
  };

  return (
    <div
      data-react-aria-top-layer="true"
      className="fixed inset-0 flex items-end justify-center pointer-events-none z-toast pb-5"
    >
      {current.type === "hint" ? (
        <HintToast
          key={current.id}
          message={current.message}
          duration={current.duration}
          onClose={() => {
            current.onClose?.();
            removeCurrentNotification();
          }}
        />
      ) : (
        <Toast
          key={current.id}
          onClose={() => {
            current.onClose?.();
            removeCurrentNotification();
          }}
          onSubmit={() => {
            current.onSubmit?.();
            removeCurrentNotification();
          }}
          onCancel={() => {
            current.onCancel?.();
            removeCurrentNotification();
          }}
          onSubmitText={current.onSubmitText}
          onCancelText={current.onCancelText}
          showTimer={current.showTimer}
          autoDismiss={current.autoDismiss}
          invertedSubmitAndCancelColors={current.invertedSubmitAndCancelColors}
          duration={current.duration}
        >
          {current.message}
        </Toast>
      )}
    </div>
  );
};
