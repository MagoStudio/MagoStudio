"use client";

import { CloudIcon } from "@components/CloudIcon";
import { InlineEditableText } from "@components/InlineEditableText";
import { Text } from "@components/Text";
import { ROUTES } from "@config/constants";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useUpdateProject } from "@domains/project/useUpdateProject";
import { isAllProjectsModalOpenAtom, isShotsPanelOpenAtom } from "@store/atoms";
import { useSetAtom } from "jotai";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

export const NavbarProjectTitle: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const selectedProjectId = useSelectedProjectId();
  const { data: selectedProject } = useProject(selectedProjectId);
  const { mutateAsync: updateProject } = useUpdateProject();
  const setIsAllProjectsModalOpen = useSetAtom(isAllProjectsModalOpenAtom);
  const setIsShotsPanelOpen = useSetAtom(isShotsPanelOpenAtom);
  const isOnboardingActive = useIsOnboardingActive();

  const isProjectPage =
    pathname?.startsWith(ROUTES.PROJECT) &&
    !pathname?.startsWith(ROUTES.PROJECT_TIMELINE);
  const isProjectTimelinePage = pathname?.startsWith(ROUTES.PROJECT_TIMELINE);
  const isScriptProjectPage = pathname?.startsWith(ROUTES.SCRIPT_PROJECT);
  const showTitle =
    !!selectedProjectId &&
    !!selectedProject &&
    (isProjectPage || isProjectTimelinePage || isScriptProjectPage);

  if (!showTitle) return null;

  const isAllProjectsModalMountedOnPage =
    isProjectPage || isProjectTimelinePage;
  const opensAllProjectsModalOnSingleClick =
    isAllProjectsModalMountedOnPage && !isOnboardingActive;

  const handleRename = (newName: string) => {
    void updateProject({
      projectId: selectedProjectId,
      projectName: newName,
      projectDescription: selectedProject.description,
      settings: selectedProject.settings,
      settingsPatch: {}
    });
  };

  return (
    <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 max-w-[40%] min-w-0 flex items-center">
      <div className="pointer-events-auto flex items-center">
        <InlineEditableText
          value={selectedProject.name}
          onSave={handleRename}
          trigger="doubleClick"
          onSingleClick={
            opensAllProjectsModalOnSingleClick
              ? () => {
                  setIsShotsPanelOpen(false);
                  setIsAllProjectsModalOpen(true);
                }
              : undefined
          }
        >
          <Text
            component="span"
            variant="sm"
            weight="bold"
            color="glyph-secondary"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            className="flex items-center gap-2 leading-5 transition-colors hover:text-glyph-primary"
          >
            {selectedProject.origin === "cloud" && (
              <span
                role="img"
                aria-label={t("project_origin.ariaLabel", {
                  origin: "cloud",
                  defaultValue: "Project origin: cloud"
                })}
                className="flex shrink-0 items-center"
              >
                <CloudIcon className="size-4" />
              </span>
            )}
            <span className="truncate">{selectedProject.name}</span>
          </Text>
        </InlineEditableText>
      </div>
    </div>
  );
};
