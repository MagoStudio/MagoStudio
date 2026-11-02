import { Icon } from "@components/Icon";
import { type IconName } from "@components/Icon/iconRegistry";
import { ProjectType } from "@schemas/scriptProject";

const PROJECT_TYPE_ICON_NAMES: Record<ProjectType, IconName<"24">> = {
  timeline: "render-video",
  script_to_shots: "bulb"
};

type Props = {
  projectType: ProjectType;
};

export const ProjectTypeIcon: React.FC<Props> = ({ projectType }) => (
  <Icon iconSet="24" iconName={PROJECT_TYPE_ICON_NAMES[projectType]} />
);
