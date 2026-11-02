"use client";

import { PostAuthRedirect } from "@components/PostAuthRedirect";
import { SuccessPageLayout } from "@components/SuccessPageLayout";
import { useTrackSignUp } from "@hooks/tracking/useTrackSignUp";
import { useRedirectCap } from "@hooks/useRedirectCap";
import { useState } from "react";

import { BackendApiProvider } from "@/providers/BackendApiProvider";

export default function SignUpSuccessPage() {
  const { isLoaded } = useTrackSignUp();
  const [mountedAtMs] = useState(() => Date.now());

  useRedirectCap();

  return (
    <>
      <SuccessPageLayout />
      <BackendApiProvider>
        <PostAuthRedirect
          readyToNavigate={isLoaded}
          mountedAtMs={mountedAtMs}
        />
      </BackendApiProvider>
    </>
  );
}
