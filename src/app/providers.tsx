"use client";

import { CloudReadyBoundary } from "@app/components/CloudReady/CloudReadyBoundary";
import { ComfyLaunchDialogHost } from "@app/components/ComfyLaunchDialog/ComfyLaunchDialogHost";
import { LibraryHealth } from "@app/components/LibraryHealth";
import { LocalSetupInProgressDialog } from "@app/components/LocalSetupWizard/LocalSetupInProgressDialog";
import { LocalSetupWizardHost } from "@app/components/LocalSetupWizard/LocalSetupWizardHost";
import { SignInGateBoundary } from "@app/components/SignInGate/SignInGate";
import { ClerkProvider } from "@clerk/react";
import { ui } from "@clerk/ui";
import { dark } from "@clerk/ui/themes";
import { MaintenanceGuard } from "@components/MaintenanceGuard";
import { ToastPile } from "@components/Toast/ToastPile";
import { i18n } from "@config/i18n";
import { getQueryClient } from "@config/queryClient";
import { isOPFSSupported } from "@domains/asset/utils/opfs/featureDetection";
import { CreateProjectDestinationDialogHost } from "@home/components/dashboard/CreateProjectDestinationDialog/CreateProjectDestinationDialogHost";
import { identityMode } from "@platform/identity";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { useIsClient } from "usehooks-ts";

import { TextModelWorker } from "@/domains/prompt/TextModelWorker";

const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || "";

if (typeof window !== "undefined") {
  void isOPFSSupported();
}

export default function Providers({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();

  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }

  const content = (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <LibraryHealth>
          <SignInGateBoundary>
            <MaintenanceGuard>{children}</MaintenanceGuard>
          </SignInGateBoundary>
          <TextModelWorker />
          <ToastPile />
          <LocalSetupWizardHost />
          <ComfyLaunchDialogHost />
          <CreateProjectDestinationDialogHost />
          <LocalSetupInProgressDialog />
        </LibraryHealth>
      </I18nextProvider>
    </QueryClientProvider>
  );

  // Offline mode never mounts ClerkProvider, so clerk-js is never fetched and
  // the app makes no network request at all. Identity comes from the local
  // stand-in instead; see src/platform/identity.tsx. First launch is not
  // offline: the gate shows Clerk's own sign-in form, so clerk-js does load
  // before the user has chosen.
  if (identityMode !== "cloud") return content;

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/"
      // Both carried over from the cloud web app's providers.tsx, and both were
      // lost in the strip-down. `theme: dark` is what makes Clerk render dark
      // natively -- every step of every flow, not just the two start steps the
      // `.cl-*` rules in globals.css happen to cover -- and `ui` is the
      // component set those rules are written against.
      ui={ui}
      appearance={{ theme: dark }}
    >
      <CloudReadyBoundary>{content}</CloudReadyBoundary>
    </ClerkProvider>
  );
}
