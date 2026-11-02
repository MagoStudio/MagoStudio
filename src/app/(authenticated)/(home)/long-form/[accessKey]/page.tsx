"use client";

import { LONG_FORM_RUN_ACCESS_KEY } from "@domains/longFormRun/constants";
import { LongFormRunScreen } from "@home/long-form/[accessKey]/components/LongFormRunScreen";
import { notFound, redirect, useParams } from "next/navigation";

import { isCloudAccountActive } from "@/platform/cloudAccount";

export default function LongFormPage() {
  const params = useParams<{ accessKey: string }>();

  if (!isCloudAccountActive()) redirect("/");

  if (params.accessKey !== LONG_FORM_RUN_ACCESS_KEY) {
    notFound();
    return null;
  }

  return <LongFormRunScreen />;
}
