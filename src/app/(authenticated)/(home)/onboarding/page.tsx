"use client";

import { OnboardingFlow } from "@home/components/onboarding/OnboardingFlow";
import { redirect } from "next/navigation";

import { isCloudAccountActive } from "@/platform/cloudAccount";

export default function OnboardingPage() {
  if (!isCloudAccountActive()) redirect("/");

  return (
    <div className="w-full h-full flex flex-col items-center overflow-y-auto px-4">
      <OnboardingFlow />
    </div>
  );
}
