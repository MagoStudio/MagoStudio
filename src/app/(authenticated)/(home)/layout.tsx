"use client";

/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { ROUTES } from "@config/constants";
import { AspectRatioProvider } from "@context/AspectRatioContext";
import { IsReferenceImageUploadingProvider } from "@context/IsReferenceImageUploading";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { normalizeRoute } from "@domains/onboarding/utils/normalizeRoute";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { AppSidebar } from "@home/components/AppSidebar/AppSidebar";
import { resolveAppSidebarWidth } from "@home/components/AppSidebar/utils/resolveAppSidebarWidth";
import { CloudProjectSyncHost } from "@home/components/CloudProjectSyncHost";
import { ShotsPanel } from "@home/components/dashboard/ShotsPanel/ShotsPanel";
import { DebugInfoHotkey } from "@home/components/DebugInfoModal/DebugInfoHotkey";
import { DebugInfoModal } from "@home/components/DebugInfoModal/DebugInfoModal";
import { VideoUploadModalHost } from "@home/components/fileUpload/VideoUploadModalHost";
import { MobileNotSupportedModal } from "@home/components/MobileNotSupportedModal";
import { NewUsersPaywallHost } from "@home/components/NewUsersPaywall/NewUsersPaywallHost";
import { OnboardingNavbar } from "@home/components/onboarding/OnboardingNavbar";
import { OnboardingRedirectGuard } from "@home/components/onboarding/OnboardingRedirectGuard";
import { OnboardingReloadDiagnostics } from "@home/components/onboarding/OnboardingReloadDiagnostics";
import { OnboardingRenderModalHost } from "@home/components/onboarding/OnboardingRenderModalHost";
import { OnboardingTutorialModalHost } from "@home/components/onboarding/OnboardingTutorialModalHost";
import { ProjectBar } from "@home/components/ProjectBar/ProjectBar";
import { RenderEndCacheInvalidator } from "@home/components/RenderEndCacheInvalidator";
import { BulkRenderingDraftModalHost } from "@home/components/SettingsEditor/BulkRenderingDraftModal/BulkRenderingDraftModalHost";
import { BulkRenderingRunModalHost } from "@home/components/SettingsEditor/BulkRenderingRunModal/BulkRenderingRunModalHost";
import { BulkRenderingShotSelectionModalHost } from "@home/components/SettingsEditor/BulkRenderingShotSelectionModal/BulkRenderingShotSelectionModalHost";
import { VideoPlayerTimeManager } from "@home/components/VideoPlayerTimeManager";
import { PaymentPastDueModal } from "@home/payment/components/PaymentPastDueModal";
import { useAppSidebarCollapse } from "@hooks/userLocalStorage/useAppSidebarCollapse";
import { useMobileWarning } from "@hooks/userLocalStorage/useMobileWarning";
import { isShotsPanelOpenAtom, PreviewMode, viewModeAtom } from "@store/atoms";
import { cn, isMobileDevice } from "@utils";
import { hasAccountCookie } from "@utils/hasAccountCookie";
import { useAtomValue, useSetAtom } from "jotai";
import { redirect, usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { isCloudAccountActive } from "@/platform/cloudAccount";
import { useUser } from "@/platform/identity";
import { isLocalApp } from "@/platform/localDesktop";
import { isCloudRenderAvailable } from "@/platform/renderTarget";
import { ProductFruitsProvider } from "@/providers/ProductFruitsProvider";

interface MainContentWrapperProps {
  children: ReactNode;
}

const MainContentWrapper: React.FC<MainContentWrapperProps> = ({
  children
}) => {
  const pathname = usePathname();
  const isPaymentPage = pathname?.startsWith(ROUTES.PAYMENT_MAIN_PAGE);
  const isScrollablePage = isPaymentPage;

  return (
    <div
      data-testid="main-content-isolate-root"
      className={cn(
        "flex w-full flex-1 min-h-0 isolate",
        isScrollablePage && "overflow-y-auto"
      )}
    >
      {children}
    </div>
  );
};

const ViewModeReset = () => {
  const selectedProjectId = useSelectedProjectId();
  const setViewMode = useSetAtom(viewModeAtom);

  useEffect(() => {
    setViewMode(PreviewMode.SINGLE);
  }, [selectedProjectId, setViewMode]);

  return null;
};

const ShotsPanelContainer = () => {
  const isShotsPanelOpen = useAtomValue(isShotsPanelOpenAtom);
  const selectedProjectId = useSelectedProjectId();
  if (!isShotsPanelOpen || !selectedProjectId) return null;
  return <ShotsPanel />;
};

export default function HomeLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const isOnboardingActive = useIsOnboardingActive();
  const isCloudMode = isCloudRenderAvailable();
  const hasCloudAccount = isCloudAccountActive();
  const { mobileWarningDismissed, setMobileWarningDismissed } =
    useMobileWarning();
  const { isAppSidebarCollapsed } = useAppSidebarCollapse();

  const [showMobileModal, setShowMobileModal] = useState(() => {
    if (typeof window === "undefined") return false;
    return isMobileDevice() && !mobileWarningDismissed;
  });
  const handleCloseMobileModal = () => {
    setShowMobileModal(false);
    setMobileWarningDismissed(true);
  };
  if (!isLoaded && !isLocalApp) {
    return null;
  }

  if (isLoaded && !isSignedIn) {
    redirect(hasAccountCookie() ? "/sign-in" : "/sign-up");
  }

  const isHomePage = pathname === "/";
  const isOnboardingRoute =
    normalizeRoute(pathname ?? "") === normalizeRoute(ROUTES.ONBOARDING);
  const isOnboardingNavbarShown = !isLocalApp && isOnboardingActive;
  const showsAppSidebar = !isOnboardingRoute && !isOnboardingNavbarShown;
  const appSidebarCurrentWidthStyle = {
    "--app-sidebar-current-width": resolveAppSidebarWidth({
      showsAppSidebar,
      isAppSidebarCollapsed
    })
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        isHomePage && "bg-home-gradient",
        isOnboardingRoute &&
          "bg-cover bg-no-repeat bg-[url('/assets/images/preview-background.png')]"
      )}
      style={appSidebarCurrentWidthStyle}
    >
      {showMobileModal && (
        <MobileNotSupportedModal onClose={handleCloseMobileModal} />
      )}
      {!isLocalApp && (
        <>
          <OnboardingRedirectGuard />
          <OnboardingReloadDiagnostics />
          <OnboardingRenderModalHost />
          <OnboardingTutorialModalHost />
        </>
      )}
      {hasCloudAccount && (
        <>
          <NewUsersPaywallHost />
          <RenderEndCacheInvalidator />
        </>
      )}
      <CloudProjectSyncHost />
      <ViewModeReset />
      <AspectRatioProvider>
        <IsReferenceImageUploadingProvider>
          <>
            <div className="flex h-screen overflow-hidden">
              {showsAppSidebar && <AppSidebar />}
              <div className="flex flex-col items-center flex-1 min-w-0 h-full">
                <VideoPlayerTimeManager />
                {isOnboardingRoute ? null : isOnboardingNavbarShown ? (
                  <OnboardingNavbar />
                ) : (
                  <ProjectBar />
                )}
                <div className="w-full flex flex-1 min-h-0">
                  <MainContentWrapper>{children}</MainContentWrapper>
                </div>

                {hasCloudAccount && <PaymentPastDueModal />}
                {!isLocalApp && (
                  <>
                    <DebugInfoModal />
                    <DebugInfoHotkey />
                  </>
                )}
              </div>
            </div>
            <ShotsPanelContainer />
            {/* A cloud project's single-video upload opens this trim modal. */}
            {(!isLocalApp || isCloudMode) && <VideoUploadModalHost />}
            {!isLocalApp && (
              <>
                <BulkRenderingShotSelectionModalHost />
                <BulkRenderingDraftModalHost />
                <BulkRenderingRunModalHost />
              </>
            )}
          </>
        </IsReferenceImageUploadingProvider>
      </AspectRatioProvider>
      {!isLocalApp && <ProductFruitsProvider />}
    </div>
  );
}
