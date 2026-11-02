import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { getModelLicensesAwaitingAcceptance } from "../../../../../desktop/shared/getModelLicensesAwaitingAcceptance";
import type { LocalModelLicense } from "../../../../../desktop/shared/localModelLicenses";

type DownloadWaitingForLicenses = {
  licenses: LocalModelLicense[];
  startDownload: () => void;
};

export const useModelLicenseAcceptanceGate = () => {
  const [downloadWaitingForLicenses, setDownloadWaitingForLicenses] =
    useState<DownloadWaitingForLicenses | null>(null);

  const acceptLicenses = useMutation({
    mutationFn: ({ licenses }: DownloadWaitingForLicenses) =>
      window.mago.localSetup.acceptModelLicenses(
        licenses.map((license) => license.huggingFaceRepo)
      ),
    onSuccess: (_result, { startDownload }) => {
      setDownloadWaitingForLicenses(null);
      startDownload();
    }
  });

  const startDownloadOnceLicensesAccepted = async (
    startDownload: () => void
  ) => {
    const licenses = getModelLicensesAwaitingAcceptance(
      await window.mago.localSetup.acceptedModelLicenseRepos()
    );
    if (licenses.length === 0) return startDownload();
    acceptLicenses.reset();
    setDownloadWaitingForLicenses({ licenses, startDownload });
  };

  return {
    startDownloadOnceLicensesAccepted,
    licenseDialogProps: {
      isOpen: downloadWaitingForLicenses !== null,
      licenses: downloadWaitingForLicenses?.licenses ?? [],
      isPending: acceptLicenses.isPending,
      error: acceptLicenses.error?.message ?? null,
      onClose: () => {
        setDownloadWaitingForLicenses(null);
      },
      onAccept: () => {
        if (downloadWaitingForLicenses)
          acceptLicenses.mutate(downloadWaitingForLicenses);
      }
    }
  };
};
