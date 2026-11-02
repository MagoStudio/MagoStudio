import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { PROJECT_TYPES_IN_NAVIGATION_ORDER } from "@domains/project/constants";
import { useTranslation } from "react-i18next";

import { HomeComingSoonToolCard } from "./HomeComingSoonToolCard";
import { HomeToolCard } from "./HomeToolCard";

export const HomeToolsBlock: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t("home_tools.title.label")}
      className="@container relative flex w-full flex-col rounded-3xl bg-element-additional-active-transparent p-8 text-glyph-primary shadow-glassmorphism backdrop-blur-md"
    >
      <Text component="h4">{t("home_tools.title.label")}</Text>
      <ul className="mt-8 grid flex-1 auto-rows-fr grid-cols-1 gap-6 @xl:grid-cols-2 @5xl:grid-cols-4">
        {PROJECT_TYPES_IN_NAVIGATION_ORDER.map((projectType) => (
          <li key={projectType}>
            <HomeToolCard projectType={projectType} />
          </li>
        ))}
        <li>
          <HomeComingSoonToolCard
            icon={<Icon iconSet="24" iconName="photo" />}
            label={t("upcoming_tools.generate_image.label")}
            description={t("upcoming_tools.generate_image.description")}
          />
        </li>
        <li>
          <HomeComingSoonToolCard
            icon={<Icon iconSet="24" iconName="ai-render" />}
            label={t("upcoming_tools.generate_video.label")}
            description={t("upcoming_tools.generate_video.description")}
          />
        </li>
      </ul>
    </section>
  );
};
