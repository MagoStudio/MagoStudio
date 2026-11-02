import { SidebarLink } from "@components/SidebarLink";
import { PROJECT_TYPES_IN_NAVIGATION_ORDER } from "@domains/project/constants";
import { buildProjectsByTypeHref } from "@domains/project/utils/buildProjectsByTypeHref";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { resolveSidebarActiveProjectType } from "./utils/resolveSidebarActiveProjectType";

export const SidebarProjectTypeLinks: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeProjectType = resolveSidebarActiveProjectType({
    pathname: pathname ?? "",
    projectTypeSearchParam: searchParams.get("type")
  });

  return (
    <ul className="flex flex-col gap-1 px-3">
      {PROJECT_TYPES_IN_NAVIGATION_ORDER.map((projectType) => (
        <li key={projectType}>
          <SidebarLink
            href={buildProjectsByTypeHref(projectType)}
            isCurrentPage={projectType === activeProjectType}
          >
            {t(`project_types.${projectType}.label`)}
          </SidebarLink>
        </li>
      ))}
    </ul>
  );
};
