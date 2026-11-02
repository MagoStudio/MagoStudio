"use client";

import { MainButton } from "@components/MainButton";
import { MEDIA_RESOURCES } from "@config/companyData";
import { useTranslation } from "react-i18next";

export default function MaintenancePage() {
  const { t } = useTranslation();

  const handleOpenDiscord = () => {
    window.open(MEDIA_RESOURCES.DISCORD_COMMUNITY, "_blank");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-black">
      {/* eslint-disable-next-line better-tailwindcss/no-unknown-classes -- Custom mask utility */}
      <div className="pointer-events-none absolute right-0 top-0 h-[60%] w-[60%] bg-cover bg-center bg-[url('/maintenance-bg.png')] mask-radial-gradient-ellipse-80-80-at-70-30-black-40-transparent-80" />

      <div className="absolute left-[18px] top-[16px]">
        <img
          alt="Mago"
          src="/logo.svg"
          className="h-[35px] w-[119px] object-contain"
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 z-10">
        <h1 className="max-w-[600px] text-center font-syne text-2xl leading-[44px] tracking-[-0.4px] text-white">
          {t("titles.maintenance.label")}
        </h1>

        <MainButton className="mt-8" onPress={handleOpenDiscord}>
          {t("actions.open_discord.label")}
        </MainButton>
      </div>
    </div>
  );
}
