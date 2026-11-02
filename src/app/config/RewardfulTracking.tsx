"use client";

import Script from "next/script";

declare global {
  interface Window {
    _rwq: string;
    rewardful: ((...args: unknown[]) => void) & { q?: unknown[] };
    Rewardful?: {
      referral?: string;
      affiliate?: {
        id: string;
        name: string;
      };
    };
  }
}

const REWARDFUL_API_KEY = process.env.NEXT_PUBLIC_REWARDFUL_API_KEY;

export function RewardfulTracking(): React.ReactNode {
  if (!REWARDFUL_API_KEY) {
    return null;
  }

  return (
    <>
      <Script
        src="https://r.wdfl.co/rw.js"
        data-rewardful={REWARDFUL_API_KEY}
      />
      <Script id="rewardful-queue" strategy="beforeInteractive">
        {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
      </Script>
    </>
  );
}
