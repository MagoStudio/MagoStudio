"use client";

import { MainButton } from "@components/MainButton";

interface CrashPageProps {
  title: string;
  buttonLabel: string;
  onAction: () => void;
}

export function CrashPage({ title, buttonLabel, onAction }: CrashPageProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-black">
      <img
        alt="Space background"
        src="/assets/images/background/dead_screen.png"
        className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
      />

      <div className="absolute left-[18px] top-[16px]">
        <img
          alt="Mago"
          src="/logo.svg"
          className="h-[35px] w-[119px] object-contain"
        />
      </div>

      <div className="z-10 flex flex-1 flex-col items-center justify-center px-4">
        <h1 className="max-w-[600px] text-center font-syne text-2xl leading-[44px] tracking-[-0.4px] text-white">
          {title}
        </h1>

        <MainButton className="mt-8" onPress={onAction}>
          {buttonLabel}
        </MainButton>
      </div>
    </div>
  );
}
