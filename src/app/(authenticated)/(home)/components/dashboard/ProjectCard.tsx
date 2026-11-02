import { useLibraryIssues } from "@app/components/LibraryHealth";
import { CloudIcon } from "@components/CloudIcon";
import { Skeleton } from "@components/Skeleton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { ProjectPreviewImage } from "./ProjectPreviewImage";

type Props =
  | {
      isLoading: true;
      title?: never;
      date?: never;
      subtitle?: never;
      image?: never;
      origin?: never;
      projectId?: never;
    }
  | {
      isLoading?: false;
      title: string;
      date: Date;
      subtitle: string;
      image: string;
      origin?: "local" | "cloud";
      projectId?: string;
    };

export const ProjectCard: React.FC<Props> = ({
  isLoading,
  title,
  date,
  subtitle,
  image,
  origin,
  projectId
}) => {
  const { t } = useTranslation();
  const issue = useLibraryIssues().find(
    (item) => item.projectId === projectId && item.kind === "project"
  );

  if (isLoading) {
    const loadingTitle = t("titles.project_loading.label");
    const loadingDate = t("titles.project_loading_date.label");
    const loadingSubtitle = t("titles.project_loading_subtitle.label");

    return (
      <div>
        <div className="w-full aspect-square rounded-3xl relative">
          <Skeleton
            variant="rounded"
            width="100%"
            height="100%"
            className="!rounded-3xl"
          />
        </div>
        <Text component="h4" variant="md">
          {loadingTitle}
        </Text>
        <div className="flex justify-between">
          <Text component="p" variant="sm" color="glyph-secondary">
            {loadingSubtitle}
          </Text>
          <Text component="p" variant="sm" color="glyph-secondary">
            {loadingDate}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="group cursor-pointer">
      {issue && (
        <p
          role="status"
          className="text-sm text-amber-400"
          title={issue.message}
        >
          Couldn’t read project — open library details for recovery information.
        </p>
      )}
      <div className="w-full aspect-square rounded-3xl relative overflow-hidden mb-1">
        <ProjectPreviewImage
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 w-full h-full group-hover:bg-surface-bg-100-opacity-80 rounded-3xl transition-colors duration-200"></div>
        {origin === "cloud" && (
          <div
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#075cff] text-white shadow-[0_4px_12px_rgba(0,91,255,0.4)]"
            data-testid="project-origin-cloud"
            aria-label={t("project_origin.ariaLabel", {
              origin: "cloud",
              defaultValue: "Project origin: cloud"
            })}
          >
            <CloudIcon />
          </div>
        )}
      </div>
      <Text
        component="h4"
        variant="md"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        {title}
      </Text>
      <div className="flex justify-between">
        <Text component="p" variant="sm" color="glyph-secondary">
          {subtitle}
        </Text>
        <Text component="p" variant="sm" color="glyph-secondary">
          {date.toLocaleDateString()}
        </Text>
      </div>
    </div>
  );
};
