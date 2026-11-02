"use client";

import { Icon } from "@components/Icon";
import { InlineEditableText } from "@components/InlineEditableText";
import { Text } from "@components/Text";
import { isAllProjectsModalOpenAtom, isShotsPanelOpenAtom } from "@store/atoms";
import { cn } from "@utils";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { useNavigationBreadcrumbData } from "./useNavigationBreadcrumbData";

const SHOT_NAME_MAX_CHARS = 25;

const truncateShotName = (name: string) =>
  name.length > SHOT_NAME_MAX_CHARS
    ? `${name.slice(0, SHOT_NAME_MAX_CHARS)}…`
    : name;

interface Props {
  showBorder?: boolean;
}

export const NavigationBreadcrumb: React.FC<Props> = ({
  showBorder = true
}) => {
  const { t } = useTranslation();
  const { showBreadcrumb, showShotName, shotName, handleRenameShot } =
    useNavigationBreadcrumbData();
  const setIsShotsPanelOpen = useSetAtom(isShotsPanelOpenAtom);
  const setIsAllProjectsModalOpen = useSetAtom(isAllProjectsModalOpenAtom);

  if (!showBreadcrumb) return null;

  const toggleShotsPanel = () => {
    setIsAllProjectsModalOpen(false);
    setIsShotsPanelOpen((prev) => !prev);
  };

  const sharedTextClass = cn(
    "transition-colors group-hover:text-glyph-primary cursor-pointer"
  );

  return (
    <div
      className={cn(
        "group flex items-center gap-1 min-w-0 h-full px-3 text-glyph-secondary",
        showBorder &&
          "-mr-px border-l border-r border-b border-glyph-invert-main"
      )}
    >
      <button
        type="button"
        onClick={toggleShotsPanel}
        className="flex items-center gap-1 shrink-0 cursor-pointer outline-hidden"
      >
        <Text
          component="span"
          variant="sm"
          weight="bold"
          color="inherit"
          className={sharedTextClass}
        >
          {t("titles.shots.label")}
        </Text>
        <Icon
          iconSet="16"
          iconName="chevron-down"
          className={sharedTextClass}
        />
      </button>
      {showShotName && (
        <>
          <Text
            component="span"
            variant="sm"
            color="inherit"
            className={cn("shrink-0 px-2", sharedTextClass)}
          >
            /
          </Text>
          <InlineEditableText
            value={shotName}
            onSave={handleRenameShot}
            trigger="doubleClick"
            onSingleClick={toggleShotsPanel}
            className="w-auto flex items-center"
          >
            <Text
              component="span"
              variant="sm"
              color="inherit"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              className={sharedTextClass}
            >
              {truncateShotName(shotName)}
            </Text>
          </InlineEditableText>
        </>
      )}
    </div>
  );
};
