import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

type Props = {
  hasBeenDescribed: boolean;
  description: string;
  inheritedDescription: string;
};

export const SheetImageDescriptionBody: React.FC<Props> = ({
  hasBeenDescribed,
  description,
  inheritedDescription
}) => {
  const { t } = useTranslation();

  if (hasBeenDescribed && description.length > 0) {
    return (
      <Text variant="xs" color="glyph-secondary" whiteSpace="pre-wrap">
        {description}
      </Text>
    );
  }

  if (hasBeenDescribed) {
    return (
      <Text variant="xs" color="glyph-tertiary">
        {t("script_project.image_description_cleared.label")}
      </Text>
    );
  }

  if (inheritedDescription.length > 0) {
    return (
      <div className="flex flex-col gap-1">
        <Text variant="xs" color="glyph-secondary" whiteSpace="pre-wrap">
          {inheritedDescription}
        </Text>
        <Text variant="2xs" color="glyph-tertiary">
          {t("script_project.image_description_inherited.label")}
        </Text>
      </div>
    );
  }

  return (
    <Text variant="xs" color="glyph-tertiary">
      {t("script_project.image_description_absent.label")}
    </Text>
  );
};
