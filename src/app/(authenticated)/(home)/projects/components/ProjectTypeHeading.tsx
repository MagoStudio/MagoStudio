import { Text } from "@components/Text";
import { ProjectType } from "@schemas/scriptProject";
import { useTranslation } from "react-i18next";

type Props = {
  projectType: ProjectType;
};

export const ProjectTypeHeading: React.FC<Props> = ({ projectType }) => {
  const { t } = useTranslation();

  return (
    <Text component="h1" variant="xl" weight="semibold">
      {t(`project_types.${projectType}.label`)}
    </Text>
  );
};
