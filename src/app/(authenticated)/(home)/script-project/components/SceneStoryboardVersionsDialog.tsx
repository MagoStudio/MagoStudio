import { AnimatedGradient } from "@components/AnimatedGradient";
import { CloseButton } from "@components/CloseButton";
import { GhostButton } from "@components/GhostButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { STORYBOARD_IMAGE_SIZE } from "@domains/scriptProject/constants";
import { useSceneStoryboard } from "@domains/scriptProject/useSceneStoryboard";
import { isSheetImageSuccessful } from "@domains/scriptProject/utils/findNewestSuccessfulSheetImage";
import { isSheetImageRendering } from "@domains/scriptProject/utils/isSheetImageRendering";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

import { SceneStoryboardVersionImage } from "./SceneStoryboardVersionImage";
import { StoryboardVersionInputsButton } from "./StoryboardVersionInputsButton";

const DIALOG_INSET_X_PX = 32;
const DIALOG_INSET_Y_PX = 56;

type Props = {
  projectId: string;
  sceneTimelineId: string;
  sceneTitle: string;
  isOpen: boolean;
  isBusy: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPin: (selectedAssetId: string | null) => void;
};

export const SceneStoryboardVersionsDialog: React.FC<Props> = ({
  projectId,
  sceneTimelineId,
  sceneTitle,
  isOpen,
  isBusy,
  onOpenChange,
  onPin
}) => {
  const { t } = useTranslation();
  const { data: sceneStoryboard } = useSceneStoryboard({
    projectId,
    sceneTimelineId,
    isVersionListOpen: isOpen
  });
  const versionsNewestFirst = sceneStoryboard?.versions ?? [];

  return (
    <OverlayDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={{
        mode: "inset",
        insetXPx: DIALOG_INSET_X_PX,
        insetYPx: DIALOG_INSET_Y_PX
      }}
      className="overflow-hidden"
    >
      <div className="relative flex h-full w-full flex-col gap-6 p-8">
        <div className="absolute right-4 top-4">
          <CloseButton onPress={() => onOpenChange(false)} />
        </div>

        <Text component="h4" variant="xl" weight="semibold">
          {t("script_project.storyboard_versions_title.label", {
            scene: sceneTitle
          })}
        </Text>

        <div
          className="grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-4 overflow-y-auto scrollbar-custom sm:grid-cols-2 xl:grid-cols-3"
          data-testid={`storyboard-version-options-${sceneTimelineId}`}
        >
          {versionsNewestFirst.map((version, versionIndex) => {
            const isVersionInUse =
              version.asset_id === sceneStoryboard?.effective_asset_id;
            const isVersionPinned =
              version.asset_id === sceneStoryboard?.selected_asset_id;
            const hasVersionFinished = isSheetImageSuccessful(version);
            const isVersionRendering = isSheetImageRendering(version);

            return (
              <div
                key={version.asset_id}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border p-2",
                  isVersionInUse
                    ? "border-glyph-action-main"
                    : "border-element-primary"
                )}
                data-testid={`storyboard-version-option-${version.asset_id}`}
              >
                <div
                  style={{
                    aspectRatio: `${STORYBOARD_IMAGE_SIZE.width} / ${STORYBOARD_IMAGE_SIZE.height}`
                  }}
                  className="relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-surface-primary"
                >
                  {isVersionRendering ? (
                    <AnimatedGradient />
                  ) : version.url ? (
                    <SceneStoryboardVersionImage
                      versionImageUrl={version.url}
                      versionAssetId={version.asset_id}
                    />
                  ) : (
                    <Text variant="xs" color="glyph-error">
                      {t("script_project.storyboard_version_failed.label")}
                    </Text>
                  )}
                </div>

                <div className="flex min-w-0 items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <Text
                      variant="2xs"
                      color="glyph-tertiary"
                      className="truncate"
                    >
                      {t("script_project.version_number.label", {
                        number: versionsNewestFirst.length - versionIndex
                      })}
                    </Text>
                    {!!version.panel_count && (
                      <StoryboardVersionInputsButton
                        panelCount={version.panel_count}
                        versionName={t("script_project.version_number.label", {
                          number: versionsNewestFirst.length - versionIndex
                        })}
                        testId={`storyboard-inputs-button-${version.asset_id}`}
                      />
                    )}
                  </div>

                  {isVersionPinned ? (
                    <GhostButton
                      colorScheme="white"
                      isDisabled={isBusy}
                      onPress={() => onPin(null)}
                      data-testid={`storyboard-version-unpin-${version.asset_id}`}
                    >
                      {t("script_project.unpin_shot_version_button.label")}
                    </GhostButton>
                  ) : isVersionInUse ? (
                    <Text variant="2xs" color="glyph-action-main">
                      {t("script_project.shot_version_current.label")}
                    </Text>
                  ) : (
                    <GhostButton
                      colorScheme="white"
                      isDisabled={isBusy || !hasVersionFinished}
                      onPress={() => onPin(version.asset_id)}
                      data-testid={`storyboard-version-use-${version.asset_id}`}
                    >
                      {t("script_project.pin_button.label")}
                    </GhostButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OverlayDialog>
  );
};
