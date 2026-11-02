"use client";

/* oxlint-disable custom-react/no-use-effect -- navigates via next/navigation's router, an external synchronization target */
import { ROUTES } from "@config/constants";
import { useNeedsOnboarding } from "@domains/onboarding/useNeedsOnboarding";
import { useMountEffect } from "@hooks/useMountEffect";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isCloudAccountActive } from "@/platform/cloudAccount";

import { computeRedirectDelay } from "./computeRedirectDelay";

const SUCCESS_BEAT_MS = 1500;

interface PostAuthRedirectProps {
  readyToNavigate: boolean;
  mountedAtMs: number;
}

export function PostAuthRedirect({
  readyToNavigate,
  mountedAtMs
}: PostAuthRedirectProps) {
  const router = useRouter();
  const { needsOnboarding, isLoading } = useNeedsOnboarding(
    isCloudAccountActive()
  );
  const [beatElapsed, setBeatElapsed] = useState(false);

  useMountEffect(() => {
    const remainingMs = computeRedirectDelay({
      elapsedMs: Date.now() - mountedAtMs,
      minBeatMs: SUCCESS_BEAT_MS
    });
    const timeout = setTimeout(() => setBeatElapsed(true), remainingMs);
    return () => clearTimeout(timeout);
  });

  const canNavigate = readyToNavigate && beatElapsed && !isLoading;

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler -- navigates via the router once async onboarding data resolves; not a UI event */
  useEffect(() => {
    if (!canNavigate) return;
    router.replace(needsOnboarding ? ROUTES.ONBOARDING : "/");
  }, [canNavigate, needsOnboarding, router]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */

  return null;
}
