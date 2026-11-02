"use client";

import { ContinueOfflineButton } from "@components/AuthPageWrapper/ContinueOfflineButton";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { ClerkLoading, ClerkLoaded, Show, useAuth } from "@platform/identity";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

export function AuthPageWrapper({ children }: Props) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (isSignedIn) {
      router.push("/");
      return;
    }

    trackingUtils.userActions.logout();
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex flex-col m-auto gap-7 p-4">
      <Show when="signed-out">
        <ClerkLoading>
          <div className="flex h-screen w-screen items-center justify-center">
            <img alt="Mago" src="/logo.svg" className="w-[280px]" />
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <div className="relative overflow-hidden text-glyph-primary backdrop-blur-xl rounded-3xl bg-[#141414]">
            {children}
          </div>
        </ClerkLoaded>
        <ContinueOfflineButton />
      </Show>
    </div>
  );
}
