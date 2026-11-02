import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Input } from "@components/Input";
import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { MINIMUM_SCENE_SHOT_DURATION_SECONDS } from "@domains/scriptProject/constants";
import { applyMinimumSceneShotDuration } from "@domains/scriptProject/utils/applyMinimumSceneShotDuration";
import {
  SceneShotDraft,
  buildEmptySceneShotDraft
} from "@domains/scriptProject/utils/buildEmptySceneShotDraft";
import { formatSceneShotSeconds } from "@domains/scriptProject/utils/formatSceneShotSeconds";
import { isFocusMovingToDraftSavingAction } from "@domains/scriptProject/utils/isFocusMovingToDraftSavingAction";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  shots: SceneShotDraft[];
  newShotDurationSeconds: number;
  onShotsChange: (shots: SceneShotDraft[]) => void;
  onSaveShots: (shots: SceneShotDraft[]) => void;
  isDisabled: boolean;
  testId: string;
}

export const SceneShotTable: React.FC<Props> = ({
  shots,
  newShotDurationSeconds,
  onShotsChange,
  onSaveShots,
  isDisabled,
  testId
}) => {
  const { t } = useTranslation();
  const isOnlyShotInScene = shots.length <= 1;
  const tableRef = useRef<HTMLDivElement>(null);
  const durationSecondsWhenFocusedRef = useRef<string | null>(null);

  const saveShotsWhenFocusLeavesTable = (
    nextFocusedTarget: EventTarget | null,
    shotsToSave: SceneShotDraft[]
  ) => {
    const isFocusStayingInTable =
      nextFocusedTarget instanceof Node &&
      !!tableRef.current?.contains(nextFocusedTarget);
    if (isFocusStayingInTable) return;
    if (isFocusMovingToDraftSavingAction(nextFocusedTarget)) return;
    onSaveShots(shotsToSave);
  };

  const updateShot = (draftId: string, changes: Partial<SceneShotDraft>) =>
    onShotsChange(
      shots.map((shot) =>
        shot.draftId === draftId ? { ...shot, ...changes } : shot
      )
    );

  return (
    <div
      ref={tableRef}
      className="flex w-full max-w-[700px] min-w-0 flex-col gap-3"
      data-testid={testId}
      onBlur={(event) =>
        saveShotsWhenFocusLeavesTable(event.relatedTarget, shots)
      }
    >
      {shots.map((shot, shotIndex) => (
        <div
          key={shot.draftId}
          className="flex flex-col gap-2 border-b border-element-primary pb-3"
          data-testid={`${testId}-shot-${shotIndex + 1}`}
        >
          <div className="flex items-center justify-between gap-2">
            <Text variant="sm" weight="medium" color="glyph-primary">
              {t("script_project.scene_shot_table.shot_number.label", {
                number: shotIndex + 1
              })}
            </Text>
            <IconActionButton
              aria-label={t(
                "script_project.scene_shot_table.delete_shot.ariaLabel",
                { number: shotIndex + 1 }
              )}
              size="sm"
              variant="transparent"
              icon={<Icon iconSet="16" iconName="delete" />}
              isDisabled={isDisabled || isOnlyShotInScene}
              data-testid={`${testId}-delete-${shotIndex + 1}`}
              onPress={() => {
                const remainingShots = shots.filter(
                  (candidate) => candidate.draftId !== shot.draftId
                );
                onShotsChange(remainingShots);
                onSaveShots(remainingShots);
              }}
            />
          </div>
          <div className="grid grid-cols-[96px_minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <label className="flex min-w-0 flex-col gap-1">
              <Text variant="xs" color="glyph-secondary">
                {t("script_project.scene_shot_table.column_duration.label")}
              </Text>
              <Input
                disabled={isDisabled}
                type="number"
                min={MINIMUM_SCENE_SHOT_DURATION_SECONDS}
                step={0.1}
                value={shot.durationSeconds}
                data-testid={`${testId}-duration-${shotIndex + 1}`}
                onFocus={() => {
                  durationSecondsWhenFocusedRef.current = shot.durationSeconds;
                }}
                onChange={(event) =>
                  updateShot(shot.draftId, {
                    durationSeconds: event.target.value
                  })
                }
                onBlur={(event) => {
                  const wasDurationEdited =
                    shot.durationSeconds !==
                    durationSecondsWhenFocusedRef.current;
                  if (!wasDurationEdited) return;
                  event.stopPropagation();
                  const shotsWithMinimumDuration = shots.map((candidate) =>
                    candidate.draftId === shot.draftId
                      ? {
                          ...candidate,
                          durationSeconds: applyMinimumSceneShotDuration(
                            candidate.durationSeconds
                          )
                        }
                      : candidate
                  );
                  onShotsChange(shotsWithMinimumDuration);
                  saveShotsWhenFocusLeavesTable(
                    event.relatedTarget,
                    shotsWithMinimumDuration
                  );
                }}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <Text variant="xs" color="glyph-secondary">
                {t("script_project.scene_shot_table.column_camera.label")}
              </Text>
              <Input
                disabled={isDisabled}
                value={shot.cameraMovement}
                placeholder={t(
                  "script_project.scene_shot_table.camera_placeholder.label"
                )}
                onChange={(event) =>
                  updateShot(shot.draftId, {
                    cameraMovement: event.target.value
                  })
                }
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <Text variant="xs" color="glyph-secondary">
                {t("script_project.scene_shot_table.column_framing.label")}
              </Text>
              <Input
                disabled={isDisabled}
                value={shot.framing}
                placeholder={t(
                  "script_project.scene_shot_table.framing_placeholder.label"
                )}
                onChange={(event) =>
                  updateShot(shot.draftId, { framing: event.target.value })
                }
              />
            </label>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Textarea
              disabled={isDisabled}
              className="min-h-16"
              autoResize
              resize="vertical"
              value={shot.description}
              placeholder={t(
                "script_project.scene_shot_table.column_description.label"
              )}
              aria-label={t(
                "script_project.scene_shot_table.column_description.label"
              )}
              onChange={(event) =>
                updateShot(shot.draftId, { description: event.target.value })
              }
            />
            <Textarea
              disabled={isDisabled}
              className="min-h-12"
              autoResize
              resize="vertical"
              value={shot.dialogue}
              placeholder={t("script_project.shot_dialogue_input.placeholder")}
              aria-label={t("script_project.shot_dialogue_input.label")}
              onChange={(event) =>
                updateShot(shot.draftId, { dialogue: event.target.value })
              }
            />
          </div>
        </div>
      ))}

      <GhostButton
        size="sm"
        colorScheme="default"
        className="self-start"
        isDisabled={isDisabled}
        data-testid={`${testId}-add`}
        onPress={() =>
          onShotsChange([
            ...shots,
            {
              ...buildEmptySceneShotDraft(
                `${testId}-added-${crypto.randomUUID()}`
              ),
              durationSeconds: formatSceneShotSeconds(newShotDurationSeconds)
            }
          ])
        }
      >
        {t("script_project.scene_shot_table.add_shot.label")}
      </GhostButton>
    </div>
  );
};
