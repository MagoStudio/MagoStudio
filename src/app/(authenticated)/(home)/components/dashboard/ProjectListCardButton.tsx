import { ProjectListItem } from "@domains/project/useProjectList";
import { pickProjectCoverImageUrl } from "@domains/project/utils/pickProjectCoverImageUrl";
import { resolveProjectPreviewUrl } from "@domains/project/utils/resolveProjectPreviewUrl";
import { useTranslation } from "react-i18next";

import { ProjectCard } from "./ProjectCard";

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  project: ProjectListItem;
};

export const ProjectListCardButton: React.FC<Props> = ({
  project,
  ...buttonProps
}) => {
  const { t } = useTranslation();
  const subtitle = `${t("titles.shots_count.label", { count: project.timeline_count })}, ${t("titles.renders_count.label", { count: project.total_renders })}`;

  return (
    <button
      type="button"
      className="appearance-none bg-transparent border-none p-0 m-0 text-left"
      {...buttonProps}
    >
      <ProjectCard
        title={project.name}
        image={resolveProjectPreviewUrl(
          project.id,
          pickProjectCoverImageUrl(project)
        )}
        date={new Date(project.updated_at)}
        subtitle={subtitle}
      />
    </button>
  );
};
