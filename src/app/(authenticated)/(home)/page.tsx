"use client";

import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { MEDIA_RESOURCES } from "@config/companyData";
import { useProjectList } from "@domains/project/useProjectList";
import { resolveProjectPreviewUrl } from "@domains/project/utils/resolveProjectPreviewUrl";
import { deferCloudProjectCatalogSync } from "@domains/scriptProject/syncCloudScriptProjects";
import { resolveProjectHref } from "@domains/scriptProject/utils/resolveProjectHref";
import { AllProjectsModal } from "@home/components/dashboard/AllProjectsModal";
import { HomeCloudSyncProgress } from "@home/components/dashboard/HomeCloudSyncProgress";
import { HomeToolsBlock } from "@home/components/dashboard/HomeToolsBlock";
import { ProjectCard } from "@home/components/dashboard/ProjectCard";
import { RunLocallyCard } from "@home/components/dashboard/RunLocallyCard";
import { TutoCard } from "@home/components/dashboard/TutoCard";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import { isLocalApp } from "@/platform/localDesktop";

const SKELETON_COUNT = 8;

export default function HomePage() {
  const { t } = useTranslation();
  const [isAllProjectsModalOpen, setIsAllProjectsModalOpen] = useState(false);
  const router = useRouter();
  const {
    allItems: projects,
    isLoading,
    totalCount
  } = useProjectList({ perPage: 12 });

  const handleProjectCardClick = (projectId: string) => {
    trackingUtils.homepageActions.openProjectClick();
    deferCloudProjectCatalogSync();
    router.push(resolveProjectHref(projects, projectId));
  };

  return (
    <div className="flex flex-col gap-6 py-8 px-6 w-full h-screen items-center overflow-y-auto scrollbar-custom">
      {isAllProjectsModalOpen && (
        <AllProjectsModal onClose={() => setIsAllProjectsModalOpen(false)} />
      )}
      <div className="max-w-home-page w-full flex flex-col gap-4">
        <RunLocallyCard />
        <div className="flex flex-col md:flex-row gap-4">
          <HomeToolsBlock />

          <div className="w-full md:w-[30%] md:max-w-64 max-w-full max-h-full gap-4 flex flex-col">
            <TutoCard
              actionTitle={t("actions.open_youtube.label")}
              image={
                <Icon
                  iconSet="16-filled"
                  iconName="youtube"
                  className="object-contain h-8 w-8 object-left fill-glyph-primary self-end"
                />
              }
              onClick={trackingUtils.homepageActions.tutorialClick}
              path={MEDIA_RESOURCES.YOUTUBE_TUTORIALS}
              title={t("titles.youtube_tutorials.label")}
            />
            <TutoCard
              actionTitle={t("actions.open_discord.label")}
              onClick={trackingUtils.homepageActions.discordClick}
              path={MEDIA_RESOURCES.DISCORD_COMMUNITY}
              title={t("titles.discord_community.label")}
              image={
                <Icon
                  iconSet="16-filled"
                  iconName="discord"
                  className="object-contain h-8 w-8 object-left fill-glyph-primary self-end"
                />
              }
            />
          </div>
        </div>
        <HomeCloudSyncProgress />
        <div className="relative w-full text-glyph-primary rounded-3xl bg-element-additional-active-transparent shadow-glassmorphism backdrop-blur-md">
          <div className="relative w-full p-8">
            <div className="flex flex-row justify-between">
              <Text component="h4">{t("titles.my_projects.label")}</Text>
              {(!isLoading || isLocalApp) && totalCount > 0 && (
                <AriaButton onPress={() => setIsAllProjectsModalOpen(true)}>
                  <Text variant="md" color="glyph-primary-on-pic">
                    {t("actions.all_projects.label")}
                  </Text>
                </AriaButton>
              )}
            </div>
            <div className="w-full grid mt-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project, index) => (
                <button
                  key={project.id}
                  data-onboarding-id={`pf-home-project-${index + 1}`}
                  onClick={() => handleProjectCardClick(project.id)}
                  className="appearance-none bg-transparent border-none p-0 m-0 text-left"
                >
                  <ProjectCard
                    projectId={project.id}
                    title={project.name}
                    image={resolveProjectPreviewUrl(
                      project.id,
                      project.preview_url
                    )}
                    date={new Date(project.updated_at)}
                    origin={isLocalApp ? project.origin : undefined}
                    subtitle={`${t("titles.shots_count.label", { count: project.timeline_count })}, ${t("titles.renders_count.label", { count: project.total_renders })}`}
                  />
                </button>
              ))}
              {!isLocalApp &&
                isLoading &&
                new Array(SKELETON_COUNT)
                  .fill(0)
                  .map((_, index) => (
                    <ProjectCard
                      key={`project-card-skeleton-${index}`}
                      isLoading={true}
                    />
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
