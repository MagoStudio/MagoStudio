"use client";

/* oxlint-disable custom-react/no-use-effect -- a timeout is external state */
import { describeCloudFailure } from "@domains/cloud/describeCloudFailure";
import { useAuth } from "@platform/identity";
import { useEffect, useRef, useState } from "react";

import { clerkFrontendApiHost } from "@/platform/clerkHost";

import { CloudUnavailableNotice } from "./CloudUnavailableNotice";

/**
 * Keeps a signed-in-but-offline launch usable.
 *
 * In cloud mode Clerk owns identity, and the authenticated layouts render
 * nothing until `isLoaded` turns true. With no network that never happens, so
 * the app would sit blank forever with no explanation and no way out. This puts
 * a bound on the wait and then offers the two things that actually help: try
 * again, or switch to offline mode, which is a first-class way to work.
 *
 * Only mounted in cloud mode — offline mode never loads Clerk at all.
 */

const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || "";
const CLOUD_READY_TIMEOUT_MS = 8000;

export const CloudReadyBoundary = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const { isLoaded } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [blockedHostsAtTimeout, setBlockedHostsAtTimeout] = useState<string[]>(
    []
  );
  const blockedHosts = useRef<string[]>([]);
  const isDesktopApp =
    typeof window !== "undefined" && typeof window.mago !== "undefined";

  // A blocked script is indistinguishable from a network failure unless the
  // violation itself is observed, so record them while waiting.
  useEffect(() => {
    const onViolation = (event: SecurityPolicyViolationEvent) => {
      try {
        blockedHosts.current.push(new URL(event.blockedURI).host);
      } catch {
        blockedHosts.current.push(event.blockedURI);
      }
    };
    document.addEventListener("securitypolicyviolation", onViolation);
    return () =>
      document.removeEventListener("securitypolicyviolation", onViolation);
  }, []);

  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => {
      setBlockedHostsAtTimeout([...blockedHosts.current]);
      setTimedOut(true);
    }, CLOUD_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  if (isLoaded) return children;
  if (!timedOut && !isDesktopApp) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <img alt="Mago" src="/logo.svg" className="w-[180px]" />
      </div>
    );
  }
  if (!timedOut) return children;
  const failure = describeCloudFailure({
    blockedHosts: blockedHostsAtTimeout,
    clerkHost: clerkFrontendApiHost(CLERK_PUBLISHABLE_KEY),
    online: typeof navigator === "undefined" ? true : navigator.onLine
  });
  return (
    <>
      {children}
      <CloudUnavailableNotice
        message={failure.message}
        detail={failure.detail}
        onRetry={
          failure.kind === "blocked"
            ? undefined
            : () => window.location.reload()
        }
      />
    </>
  );
};
