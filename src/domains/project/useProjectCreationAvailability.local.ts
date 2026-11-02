"use client";

import { isCloudRenderAvailable } from "@/platform/renderTarget";

import { ProjectCreationAvailability } from "./projectCreationTarget";

/** A local project is always creatable in the desktop app: it is stored in the
 * library and needs no render engine. ComfyUI is only needed once the user
 * renders, and that is gated at render time, not here. */
export const useProjectCreationAvailability = (): {
  availability: ProjectCreationAvailability;
  isChecking: boolean;
} => {
  const hasDesktop = typeof window !== "undefined" && !!window.mago;

  return {
    availability: {
      local: hasDesktop,
      cloud: isCloudRenderAvailable()
    },
    isChecking: false
  };
};
