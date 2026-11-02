/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { ROUTES } from "@config/constants";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const REDIRECT_COUNTDOWN_SECONDS = 3;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  description: string;
  redirectText?: string;
  redirectPath?: string;
};

export const PaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  description,
  redirectText = "",
  redirectPath = ROUTES.PAYMENT_MAIN_PAGE
}) => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN_SECONDS);
  const shouldRedirect = !!redirectText;

  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setCountdown(REDIRECT_COUNTDOWN_SECONDS);
  }

  useEffect(() => {
    let countdownTimer: NodeJS.Timeout | null = null;

    if (isOpen && shouldRedirect && countdown > 0) {
      countdownTimer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isOpen && shouldRedirect && countdown === 0) {
      onClose();
      router.replace(redirectPath);
    }

    return () => {
      if (countdownTimer) clearTimeout(countdownTimer);
    };
  }, [isOpen, countdown, shouldRedirect, redirectPath, router, onClose]);

  return (
    <Modal open={isOpen} onClose={onClose} width="sm">
      <div className="flex flex-col items-center gap-2">
        <div className="mb-2.5 h-16 w-16">
          <img alt="" src="/credits_set.gif" />
        </div>
        <Text align="center" select="none" variant="lg">
          {description}
        </Text>
        {shouldRedirect && (
          <Text
            align="center"
            color="glyph-secondary"
            select="none"
            variant="sm"
          >
            {redirectText} in {countdown} seconds
          </Text>
        )}
      </div>
    </Modal>
  );
};
