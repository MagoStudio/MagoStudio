import { ONBOARDING_SEARCH_PARAM } from "@config/constants";
import { duplicateTemplateProject } from "@domains/project/duplicateTemplateProject";
import { useProjectList } from "@domains/project/useProjectList";
import { useUpdateProject } from "@domains/project/useUpdateProject";
import { deleteTimeline } from "@domains/shot/deleteTimeline";
import { useToast } from "@store/useToast";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ONBOARDING_TEMPLATE_ID } from "./constants";
import { useOnboardingProgress } from "./useOnboardingProgress";
import { getTemplateTimelineIdsToTrim } from "./utils/getTemplateTimelineIdsToTrim";
import { buildOnboardingProjectName } from "./utils/onboardingProjectName";
import { resolveTemplateTimelineId } from "./utils/resolveTemplateTimelineId";

export const useStartOnboardingFromTemplate = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [, setOnboardingProgress] = useOnboardingProgress();
  const { mutateAsync: updateProject } = useUpdateProject();
  const { allItems: existingProjects } = useProjectList();

  const mutation = useMutation({
    mutationFn: async (shotName: string) => {
      const clonedProject = await duplicateTemplateProject(
        ONBOARDING_TEMPLATE_ID
      );

      await updateProject({
        projectId: clonedProject.id,
        projectName: buildOnboardingProjectName(
          existingProjects.map((project) => project.name)
        ),
        projectDescription: "",
        settings: clonedProject.settings,
        settingsPatch: {}
      });

      const selectedTimelineId = resolveTemplateTimelineId(
        clonedProject.timelines ?? [],
        shotName
      );

      const idsToTrim = getTemplateTimelineIdsToTrim(
        clonedProject.timelines ?? [],
        selectedTimelineId
      );
      const trimResults = await Promise.allSettled(
        idsToTrim.map((id) => deleteTimeline(id))
      );
      const trimFailures = trimResults.filter(
        (result) => result.status === "rejected"
      );
      if (trimFailures.length > 0) {
        throw new Error(
          `Failed to trim ${trimFailures.length} onboarding template timeline(s): ${trimFailures.map((failure) => failure.reason).join("; ")}`
        );
      }

      return { projectId: clonedProject.id, selectedTimelineId };
    },
    onSuccess: ({ projectId, selectedTimelineId }) => {
      setOnboardingProgress((prev) => ({ ...prev, step: "generate-image" }));
      router.push(
        `/project?projectId=${encodeURIComponent(projectId)}&timelineId=${encodeURIComponent(selectedTimelineId)}&${ONBOARDING_SEARCH_PARAM}=1&tool=edit-frame`
      );
    },
    onError: (error) => {
      console.error("Failed to start onboarding from template:", error);
      showToast({
        message: t("notifications.onboarding_template_error.description")
      });
    }
  });

  return {
    startFromTemplate: mutation.mutate,
    isPending: mutation.isPending
  };
};
