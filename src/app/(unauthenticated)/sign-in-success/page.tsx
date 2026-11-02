"use client";

import { PostAuthRedirect } from "@components/PostAuthRedirect";
import { SuccessPageLayout } from "@components/SuccessPageLayout";
import { useMountEffect } from "@hooks/useMountEffect";
import { useRedirectCap } from "@hooks/useRedirectCap";
import { useUser } from "@platform/identity";
import { setHasAccountCookie } from "@utils/hasAccountCookie";
import { useState } from "react";

import { BackendApiProvider } from "@/providers/BackendApiProvider";

export default function SignInSuccessPage() {
  const { isLoaded } = useUser();
  const [mountedAtMs] = useState(() => Date.now());

  useMountEffect(() => {
    setHasAccountCookie();
  });

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
