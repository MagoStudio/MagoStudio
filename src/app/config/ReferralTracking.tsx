"use client";

import { useMountEffect } from "@hooks/useMountEffect";
/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { useUser } from "@platform/identity";
import { useEffect } from "react";

import { enrichUnsafeMetadata } from "./utils/enrichUnsafeMetadata";

const REFERRAL_ID_STORAGE_KEY = "referral_id_pending";

export function ReferralTracking(): null {
  const { user, isLoaded } = useUser();

  useMountEffect(() => {
    window.rewardful?.("ready", function () {
      const referral = window.Rewardful?.referral;
      if (referral) {
        localStorage.setItem(REFERRAL_ID_STORAGE_KEY, referral);
      }
    });
  });

  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded || !user) {
      return;
    }

    const existingReferralId = user.unsafeMetadata?.referral_id as
      | string
      | undefined;

    if (existingReferralId && existingReferralId !== "") {
      localStorage.removeItem(REFERRAL_ID_STORAGE_KEY);
      return;
    }

    const pendingReferralId = localStorage.getItem(REFERRAL_ID_STORAGE_KEY);

    if (!pendingReferralId || pendingReferralId.trim() === "") {
      return;
    }

    enrichUnsafeMetadata(user, { referral_id: pendingReferralId })
      .then(() => {
        localStorage.removeItem(REFERRAL_ID_STORAGE_KEY);
      })
      .catch((error) => {
        console.error("Failed to update referral_id in unsafeMetadata:", error);
      });
  }, [isLoaded, user]);

  return null;
}
