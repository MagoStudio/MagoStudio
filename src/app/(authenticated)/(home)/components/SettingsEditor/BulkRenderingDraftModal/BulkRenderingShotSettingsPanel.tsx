import { Accordion } from "@components/Accordion";
import { GhostButton } from "@components/GhostButton";
import { MainButton } from "@components/MainButton";
import { Message } from "@components/Message";
import { Text } from "@components/Text";
import {
  collectShotEditableSettingKeys,
  filterToShotEditableSettingsGroups
} from "@domains/bulkRendersRun/utils/filterBulkRenderingShotSettingsPanelGroups";
import { useCopyToClipboard } from "@hooks/useCopyToClipboard";
import { useMountEffect } from "@hooks/useMountEffect";
import { useIsTeamMember } from "@hooks/userLocalStorage";
import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { RenderSettingsVideoGroups } from "@models/video/RenderSettingsVideoGroups";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { settingsGroupsByLevel } from "@models/video/utils/settingsGroupsByLevel";
import { cn } from "@utils";
import { RefObject, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useOnClickOutside } from "usehooks-ts";

export interface BulkRenderingShotSettingsPanelProps {
  shotId: string;
  shotName: string;
  videoModel: VideoModelDefinition;
  values: VideoSettings;
  isReadOnly?: boolean;
  errors?: { key: string; message: string }[];
  onSave: (settingsPatch: Partial<VideoSettings>) => void;
  onCancel: () => void;
}

export function BulkRenderingShotSettingsPanel({
  shotId,
  shotName,
  videoModel,
  values,
  isReadOnly,
  errors,
  onSave,
  onCancel
}: BulkRenderingShotSettingsPanelProps) {
  const { t } = useTranslation();
  const errorMessageBySettingKey = Object.fromEntries(
    (errors ?? []).map((error) => [
      error.key,
      t(error.message, { defaultValue: error.message })
    ])
  );
  const isTeamMember = useIsTeamMember();
  const { copyToClipboard, message, resetMessage } = useCopyToClipboard();
  const copyButtonRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useMountEffect(() => {
    const elementFocusedBeforeThePanelOpened =
      document.activeElement as HTMLElement | null;
    return () => elementFocusedBeforeThePanelOpened?.focus?.();
  });

  const [buffer, setBuffer] = useState<Partial<VideoSettings>>({});
  const [expandedLevels, setExpandedLevels] = useState<
    Set<"quality" | "advanced">
  >(new Set(["quality", "advanced"]));

  const bufferedValues: VideoSettings = { ...values, ...buffer };

  const writeVideoSettingValue = ({
    key,
    value
  }: {
    key: keyof VideoSettings;
    value: unknown;
  }) => {
    setBuffer((currentBuffer) => ({
      ...currentBuffer,
      [key]: value as VideoSettings[keyof VideoSettings]
    }));
  };

  const handleValueChange = (key: string, value: unknown) => {
    const cascadingUpdates = videoModel.onValueChange?.(
      key,
      value,
      bufferedValues
    );
    if (!cascadingUpdates) return;
    Object.entries(cascadingUpdates).forEach(([updateKey, updateValue]) => {
      writeVideoSettingValue({
        key: updateKey as keyof VideoSettings,
        value: updateValue
      });
    });
  };

  const allGroupsByLevel = settingsGroupsByLevel(
    videoModel,
    bufferedValues,
    isTeamMember
  );
  const groupsByLevel = {
    main: filterToShotEditableSettingsGroups(allGroupsByLevel.main),
    technical: filterToShotEditableSettingsGroups(allGroupsByLevel.technical),
    quality: filterToShotEditableSettingsGroups(allGroupsByLevel.quality),
    advanced: filterToShotEditableSettingsGroups(allGroupsByLevel.advanced)
  };

  const shotEditableSettingKeys = collectShotEditableSettingKeys(
    Object.values(groupsByLevel).flat()
  );
  const errorsForSettingsThePanelNeverRenders = (errors ?? []).filter(
    (error) => !shotEditableSettingKeys.has(error.key)
  );
  const generalErrorMessages = errorsForSettingsThePanelNeverRenders.map(
    (error) => t(error.message, { defaultValue: error.message })
  );

  const handleReset = () => {
    const modelDefaults = extractDefaultVideoSettings(videoModel, isTeamMember);
    setBuffer(
      Object.fromEntries(
        Object.entries(modelDefaults).filter(([settingKey]) =>
          shotEditableSettingKeys.has(settingKey)
        )
      )
    );
  };

  const handleCopy = () => {
    void copyToClipboard(JSON.stringify(bufferedValues, null, 2));
  };

  const handleSave = () => onSave(buffer);

  const handleCancel = () => onCancel();

  useOnClickOutside(panelRef as RefObject<HTMLElement>, handleCancel);

  const setLevelExpanded = (
    level: "quality" | "advanced",
    isExpanded: boolean
  ) => {
    setExpandedLevels((currentLevels) => {
      const nextLevels = new Set(currentLevels);
      if (isExpanded) {
        nextLevels.add(level);
      } else {
        nextLevels.delete(level);
      }
      return nextLevels;
    });
  };

  return createPortal(
    <div
      ref={panelRef}
      data-react-aria-top-layer="true"
      data-testid={`bulk-rendering-shot-settings-panel-${shotId}`}
      aria-label={t("bulk_rendering.shot_settings_panel_dialog.ariaLabel", {
        shotName
      })}
      className={cn(
        "fixed inset-y-0 left-0 z-nested-modal flex w-[380px] flex-col gap-2",
        "bg-surface-primary shadow-[0px_8px_28px_0px_rgba(0,0,0,0.8)]"
      )}
    >
      <div className="flex h-9 shrink-0 items-center px-3 pt-4">
        <Text
          component="span"
          variant="sm"
          color="glyph-secondary"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {t("bulk_rendering.shot_settings_panel_title.label")}
        </Text>
      </div>

      <div className="scrollbar-custom flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-4">
        {generalErrorMessages.length > 0 && (
          <div className="flex flex-col gap-1">
            {generalErrorMessages.map((generalErrorMessage) => (
              <Text
                key={generalErrorMessage}
                component="span"
                variant="xs"
                color="glyph-error"
              >
                {generalErrorMessage}
              </Text>
            ))}
          </div>
        )}
        {groupsByLevel.main.length > 0 && (
          <RenderSettingsVideoGroups
            groups={groupsByLevel.main}
            values={bufferedValues}
            isDisabled={isReadOnly}
            isTeamMember={isTeamMember}
            writeVideoSettingValue={writeVideoSettingValue}
            onValueChange={isReadOnly ? undefined : handleValueChange}
            errorMessageBySettingKey={errorMessageBySettingKey}
          />
        )}

        {groupsByLevel.technical.length > 0 && (
          <RenderSettingsVideoGroups
            groups={groupsByLevel.technical}
            values={bufferedValues}
            isDisabled={isReadOnly}
            isTeamMember={isTeamMember}
            writeVideoSettingValue={writeVideoSettingValue}
            onValueChange={isReadOnly ? undefined : handleValueChange}
            errorMessageBySettingKey={errorMessageBySettingKey}
          />
        )}

        <div className="flex h-6 shrink-0 items-center justify-between">
          <Text
            component="h4"
            variant="sm"
            color="glyph-secondary"
            select="none"
          >
            {t("titles.technical_settings.label")}
          </Text>
          {!isReadOnly && (
            <div className="flex gap-1">
              <GhostButton onPress={handleReset} size="sm">
                {t("actions.reset_settings.label")}
              </GhostButton>
              <div ref={copyButtonRef}>
                <GhostButton
                  size="sm"
                  aria-label={t("actions.copy_settings.ariaLabel")}
                  onPress={handleCopy}
                >
                  {t("actions.copy_settings.label")}
                </GhostButton>
                {message && (
                  <Message
                    variant={message.variant}
                    onDismiss={resetMessage}
                    anchorRef={copyButtonRef}
                    placement="top"
                  >
                    {message.text}
                  </Message>
                )}
              </div>
            </div>
          )}
          {isReadOnly && (
            <GhostButton
              size="sm"
              aria-label={t("actions.copy_settings.ariaLabel")}
              onPress={handleCopy}
            >
              {t("actions.copy_settings.label")}
            </GhostButton>
          )}
        </div>

        {groupsByLevel.quality.length > 0 && (
          <Accordion
            label={t("titles.quality_settings.label")}
            isExpanded={expandedLevels.has("quality")}
            onExpandedChange={(isExpanded) =>
              setLevelExpanded("quality", isExpanded)
            }
          >
            <RenderSettingsVideoGroups
              groups={groupsByLevel.quality}
              values={bufferedValues}
              isDisabled={isReadOnly}
              isTeamMember={isTeamMember}
              writeVideoSettingValue={writeVideoSettingValue}
              onValueChange={isReadOnly ? undefined : handleValueChange}
              errorMessageBySettingKey={errorMessageBySettingKey}
            />
          </Accordion>
        )}

        {groupsByLevel.advanced.length > 0 && (
          <Accordion
            label={t("titles.advanced_settings.label")}
            isExpanded={expandedLevels.has("advanced")}
            onExpandedChange={(isExpanded) =>
              setLevelExpanded("advanced", isExpanded)
            }
          >
            <RenderSettingsVideoGroups
              groups={groupsByLevel.advanced}
              values={bufferedValues}
              isDisabled={isReadOnly}
              isTeamMember={isTeamMember}
              writeVideoSettingValue={writeVideoSettingValue}
              onValueChange={isReadOnly ? undefined : handleValueChange}
              errorMessageBySettingKey={errorMessageBySettingKey}
            />
          </Accordion>
        )}
      </div>

      <div className="flex shrink-0 gap-2 bg-surface-secondary px-4 py-3 shadow-[0px_0px_16px_0px_rgba(0,0,0,0.6)]">
        <MainButton
          className="flex-1"
          colorScheme="secondary"
          onPress={handleCancel}
        >
          {isReadOnly
            ? t("actions.close.label")
            : t("bulk_rendering.shot_settings_panel_cancel_button.label")}
        </MainButton>
        {!isReadOnly && (
          <MainButton
            className="flex-1"
            colorScheme="primary"
            onPress={handleSave}
          >
            {t("bulk_rendering.shot_settings_panel_save_button.label")}
          </MainButton>
        )}
      </div>
    </div>,
    document.body
  );
}
