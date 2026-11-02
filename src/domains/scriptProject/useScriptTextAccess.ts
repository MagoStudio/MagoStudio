import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { isCloudAccountActive } from "@/platform/cloudAccount";
import { queryKeys } from "@/queryKeys";

/** An action-time check, scoped to the Script tab rather than global routing. */
export const useScriptTextAccess = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const checking = useRef(false);
  const [isCloudPending, setIsCloudPending] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const hardware = useQuery({
    queryKey: ["script-text-setup-hardware"],
    queryFn: () => window.mago.localSetup.probeHardware(),
    enabled: isOpen && !!window.mago?.localSetup?.probeHardware,
    retry: false
  });

  const ensureAccess = async (): Promise<boolean> => {
    if (checking.current) return false;
    if (!window.mago) return true;
    checking.current = true;
    setIsChecking(true);
    try {
      const settings = await window.mago.comfy.get();
      if (isCloudAccountActive() && settings.textModelProvider !== "local")
        return true;
      // The bridge probes the configured Q3/Q5 model and its required nodes.
      // Overall setup readiness also includes render models we don't need here.
      const status = await window.mago.comfy.scriptSetupStatus();
      const textSetup = status.optional.find(
        (group) => group.id === "script-text"
      );
      if (
        textSetup?.requirements.length &&
        textSetup.requirements.every((item) => item.status === "installed")
      )
        return true;
    } catch {
      // An unreachable engine cannot confirm a usable local setup.
    } finally {
      checking.current = false;
      setIsChecking(false);
    }
    setCloudError(null);
    setIsOpen(true);
    return false;
  };

  const enableCloud = async () => {
    if (isCloudPending) return;
    setIsCloudPending(true);
    setCloudError(null);
    try {
      const settings = await window.mago.comfy.get();
      await window.mago.comfy.save({ ...settings, textModelProvider: "cloud" });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.comfySettings.all
      });
      if (!isCloudAccountActive()) {
        await window.mago.account.chooseMode("cloud");
      } else {
        setIsOpen(false);
      }
    } catch (error) {
      setCloudError(
        error instanceof Error && error.message
          ? error.message
          : t("script_project.text_access_cloud_failed.label")
      );
    } finally {
      setIsCloudPending(false);
    }
  };

  return {
    ensureAccess,
    isChecking,
    isOpen,
    close: () => setIsOpen(false),
    isSignedIn: isCloudAccountActive(),
    canSetUpLocally:
      hardware.data?.verdict === "ready" ||
      hardware.data?.verdict === "limited",
    isCloudPending,
    cloudError,
    enableCloud
  };
};
