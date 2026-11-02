"use client";

import { i18n } from "@config/i18n";
import { getQueryClient } from "@config/queryClient";
import { usePreventCloseWhileUploading } from "@domains/bulkUpload/hooks/usePreventCloseWhileUploading";
import { useCloudRenderWatcher } from "@domains/cloud/useCloudRenderWatcher";
/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { useUser } from "@platform/identity";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useRef } from "react";
import { I18nextProvider } from "react-i18next";

import { isCloudAccountActive } from "@/platform/cloudAccount";
import { BackendApiProvider } from "@/providers/BackendApiProvider";

function QueryCacheClearer({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const wasSignedInRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (wasSignedInRef.current === true && isSignedIn === false) {
      queryClient.clear();
    }

    wasSignedInRef.current = isSignedIn;
  }, [isSignedIn, isLoaded, queryClient]);

  return <>{children}</>;
}

export default function AuthenticatedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  usePreventCloseWhileUploading();
  useCloudRenderWatcher();

  const content = (
    <QueryClientProvider client={queryClient}>
      <QueryCacheClearer>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </QueryCacheClearer>
    </QueryClientProvider>
  );

  // BackendApiProvider installs the axios interceptor that carries the Clerk
  // token and the API key, so every cloud call is unauthorized without it. Only
  // mounted for a signed-in account: offline it would redirect to sign-in and
  // block the app behind a request it must never make.
  if (!isCloudAccountActive()) return content;

  return <BackendApiProvider>{content}</BackendApiProvider>;
}
