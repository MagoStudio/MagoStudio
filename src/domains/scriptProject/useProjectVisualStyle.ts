import { Project } from "@schemas/project";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { queryKeys } from "@/queryKeys";

import { useSaveProjectSettingsPatch } from "./useSaveProjectSettingsPatch";

type UnconfirmedVisualStyleSave = {
  projectId: string;
  attemptedVisualStyle: string;
  failure: { error: unknown } | null;
};

export const useProjectVisualStyle = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const { project, saveProjectSettingsPatchAsync } =
    useSaveProjectSettingsPatch(projectId);
  const [unconfirmedVisualStyleSave, setUnconfirmedVisualStyleSave] =
    useState<UnconfirmedVisualStyleSave | null>(null);
  const latestVisualStyleSaveIdRef = useRef(0);
  const visualStyleSaveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const savedVisualStyle = project?.settings?.visual_style ?? "";
  const currentProjectVisualStyleSave =
    unconfirmedVisualStyleSave?.projectId === projectId
      ? unconfirmedVisualStyleSave
      : null;
  const visualStyleShownInField =
    currentProjectVisualStyleSave?.attemptedVisualStyle ?? savedVisualStyle;

  const commitVisualStyle = (nextVisualStyle: string): void => {
    if (!projectId) return;
    const targetProjectId = projectId;
    latestVisualStyleSaveIdRef.current += 1;
    const visualStyleSaveId = latestVisualStyleSaveIdRef.current;
    const isLatestVisualStyleSave = () =>
      visualStyleSaveId === latestVisualStyleSaveIdRef.current;

    const readConfirmedVisualStyle = () =>
      queryClient.getQueryData<Project>(queryKeys.project.byId(targetProjectId))
        ?.settings?.visual_style ?? "";

    const sendVisualStyle = async () => {
      const pendingSave = saveProjectSettingsPatchAsync({
        visual_style: nextVisualStyle
      });
      if (!pendingSave) throw new Error("Project is not loaded");
      await pendingSave;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(targetProjectId)
      });
    };

    setUnconfirmedVisualStyleSave({
      projectId: targetProjectId,
      attemptedVisualStyle: nextVisualStyle,
      failure: null
    });

    visualStyleSaveQueueRef.current = visualStyleSaveQueueRef.current.then(
      async () => {
        try {
          if (nextVisualStyle !== readConfirmedVisualStyle())
            await sendVisualStyle();
        } catch (err) {
          if (!isLatestVisualStyleSave()) return;
          setUnconfirmedVisualStyleSave({
            projectId: targetProjectId,
            attemptedVisualStyle: nextVisualStyle,
            failure: { error: err }
          });
          return;
        }
        if (isLatestVisualStyleSave()) setUnconfirmedVisualStyleSave(null);
      }
    );
  };

  return {
    visualStyleShownInField,
    commitVisualStyle,
    visualStyleSaveFailure: currentProjectVisualStyleSave?.failure ?? null
  };
};
