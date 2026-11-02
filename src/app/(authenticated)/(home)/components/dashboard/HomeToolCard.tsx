import { Text } from "@components/Text";
import { buildProjectsByTypeHref } from "@domains/project/utils/buildProjectsByTypeHref";
import { ProjectType } from "@schemas/scriptProject";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { ProjectTypeIcon } from "./ProjectTypeIcon";

type Props = {
  projectType: ProjectType;
};

export const HomeToolCard: React.FC<Props> = ({ projectType }) => {
  const { t } = useTranslation();

  return (
    <Link
      href={buildProjectsByTypeHref(projectType)}
      className="flex h-full flex-col gap-2 rounded-3xl bg-surface-bg-100 p-6 text-glyph-primary outline-hidden backdrop-blur-xl transition-[filter] hover:brightness-115 focus-visible:ring-2 focus-visible:ring-glyph-action-main"
    >
      <ProjectTypeIcon projectType={projectType} />
      <Text component="h3" variant="lg" weight="semibold" lineHeight="snug">
        {t(`project_types.${projectType}.label`)}
      </Text>
      <Text variant="sm" color="glyph-secondary" lineHeight="relaxed">
        {t(`project_types.${projectType}.description`)}
      </Text>
    </Link>
  );
};
