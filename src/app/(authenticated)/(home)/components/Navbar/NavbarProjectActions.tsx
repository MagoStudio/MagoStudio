"use client";

import { Icon } from "@components/Icon";
import { ROUTES } from "@config/constants";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useAddVideo } from "@hooks/useAddVideo";
import { cn } from "@utils";
import { usePathname } from "next/navigation";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

interface Props {
  showBorder?: boolean;
}

export const NavbarProjectActions: React.FC<Props> = ({
  showBorder = true
}) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const selectedProjectId = useSelectedProjectId();
  const { triggerAddVideo } = useAddVideo();

  const isProjectPage =
    pathname?.startsWith(ROUTES.PROJECT) &&
    !pathname?.startsWith(ROUTES.PROJECT_TIMELINE);
  const isProjectTimelinePage = pathname?.startsWith(ROUTES.PROJECT_TIMELINE);
  const showActions =
    !!selectedProjectId && (isProjectPage || isProjectTimelinePage);

  if (!showActions) return null;

  return (
    <div
      className={cn(
        "flex items-center shrink-0 h-full px-3",
        showBorder &&
          "-mr-px border-l border-r border-b border-glyph-invert-main"
      )}
    >
      <AriaButton
        type="button"
        aria-label={t("actions.add_video.label")}
        onPress={triggerAddVideo}
        className="shrink-0 size-6 flex items-center justify-center rounded bg-element-primary text-glyph-secondary cursor-pointer transition-colors outline-hidden data-[hovered]:text-glyph-primary"
      >
        <Icon iconSet="16" iconName="upload" className="h-4 w-4" />
      </AriaButton>
    </div>
  );
};
