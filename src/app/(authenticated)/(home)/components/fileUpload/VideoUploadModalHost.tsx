import { ONBOARDING_SEARCH_PARAM } from "@config/constants";
import { ONBOARDING_RENDER_DURATION_SECONDS } from "@domains/onboarding/constants";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useOnboardingProgress } from "@domains/onboarding/useOnboardingProgress";
import { buildOnboardingProjectName } from "@domains/onboarding/utils/onboardingProjectName";
import { fetchProject } from "@domains/project/fetchProject";
import { useProjectList } from "@domains/project/useProjectList";
import { useUpdateProject } from "@domains/project/useUpdateProject";
import { VideoUploadModal } from "@home/components/fileUpload/VideoUploadModal";
import { useMountEffect } from "@hooks/useMountEffect";
import {
  addVideoRequestAtom,
  currentVideoFrameAtom,
  isPlayingAtom
} from "@store/atoms";
import { useAtom, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";

export const VideoUploadModalHost = () => {
  const router = useRouter();
  const [request, setRequest] = useAtom(addVideoRequestAtom);
  const setCurrentVideoFrame = useSetAtom(currentVideoFrameAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const [, setOnboardingProgress] = useOnboardingProgress();
  const isOnboardingActive = useIsOnboardingActive();
  const { mutateAsync: updateProject } = useUpdateProject();
  const { allItems: existingProjects } = useProjectList({
    enabled: isOnboardingActive
  });

  useMountEffect(() => () => setRequest(null));

  if (!request) return null;

  const handleUploadSuccess = async (newProjectId: string, shotId: string) => {
    setCurrentVideoFrame(0);
    setIsPlaying(false);
    setRequest(null);

    if (isOnboardingActive) {
      try {
        const currentProject = await fetchProject(newProjectId).catch(
          () => undefined
        );
        await updateProject({
          projectId: newProjectId,
          projectName: buildOnboardingProjectName(
            existingProjects.map((project) => project.name)
          ),
          projectDescription: "",
          settings: currentProject?.settings,
          settingsPatch: {}
        });
      } catch (error) {
        console.error("Failed to name onboarding project:", error);
      }

      setOnboardingProgress((prev) => ({
        ...prev,
        step: "generate-image"
      }));
      router.push(
        `/project?projectId=${newProjectId}&timelineId=${shotId}&${ONBOARDING_SEARCH_PARAM}=1&tool=edit-frame`
      );
      return;
    }

    router.push(
      `/project?projectId=${newProjectId}&timelineId=${shotId}&tool=render-video`
    );
  };

  return (
    <VideoUploadModal
      videoFile={request.file}
      onClose={() => setRequest(null)}
      onUploadSuccess={handleUploadSuccess}
      existingProjectId={request.existingProjectId}
      minDurationSeconds={
        isOnboardingActive ? ONBOARDING_RENDER_DURATION_SECONDS : undefined
      }
    />
  );
};
