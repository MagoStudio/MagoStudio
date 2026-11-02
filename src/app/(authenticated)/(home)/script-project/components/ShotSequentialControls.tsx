import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import {
  MAX_SEQUENTIAL_KEY_FRAMES,
  MIN_SEQUENTIAL_KEY_FRAMES,
  SEQUENTIAL_CONTINUATION_OFF
} from "@domains/scriptProject/constants";
import { formatShotTitle } from "@domains/scriptProject/utils/formatShotTitle";
import { resolveDefaultSequentialPrompt } from "@domains/scriptProject/utils/resolveDefaultSequentialPrompt";
import { ResolvedSequentialShotConfig } from "@domains/scriptProject/utils/resolveSequentialShotConfig";
import { resolveShotChainPositionLabelKey } from "@domains/scriptProject/utils/resolveShotChainPositionLabelKey";
import { withSequentialContinuation } from "@domains/scriptProject/utils/withSequentialContinuation";
import { SequentialPromptDefaults, ShotState } from "@schemas/scriptProject";
import { useState } from "react";
import { Button } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import { ShotSequentialModeDropdown } from "./ShotSequentialModeDropdown";
import { ShotSequentialNumberInput } from "./ShotSequentialNumberInput";
import { ShotSequentialOpeningFrameDropdown } from "./ShotSequentialOpeningFrameDropdown";

type Props = {
  sequential: ResolvedSequentialShotConfig;
  sequentialPromptDefaults: SequentialPromptDefaults | null;
  predecessorShot: ShotState;
  isDisabled: boolean;
  onChange: (sequential: ResolvedSequentialShotConfig) => void;
  testIdSuffix: string | number;
};

export const ShotSequentialControls: React.FC<Props> = ({
  sequential,
  sequentialPromptDefaults,
  predecessorShot,
  isDisabled,
  onChange,
  testIdSuffix
}) => {
  const { t } = useTranslation();
  const hasOwnAppendix = sequential.prompt_appendix.trim() !== "";
  const defaultAppendixText = resolveDefaultSequentialPrompt(
    sequentialPromptDefaults,
    sequential
  );
  // Held only while the user types, so a blank box stays blank until blur instead of
  // snapping back to the default mid-edit.
  const [typedAppendixText, setTypedAppendixText] = useState<string | null>(
    null
  );
  const appendixText =
    typedAppendixText ??
    (hasOwnAppendix ? sequential.prompt_appendix : (defaultAppendixText ?? ""));

  const restoreDefaultWhenAppendixCleared = () => {
    if (typedAppendixText === null) return;
    setTypedAppendixText(null);
    if (typedAppendixText.trim() === "") resetAppendixToDefault();
  };

  const resetAppendixToDefault = () => {
    setTypedAppendixText(null);
    onChange({ ...sequential, prompt_appendix: "" });
  };

  const chainPositionLabel = t(
    resolveShotChainPositionLabelKey({
      isSequentialEnabled: sequential.enabled
    }),
    {
      shot: formatShotTitle({
        heading: predecessorShot.heading,
        shotIndex: predecessorShot.shot_index
      })
    }
  );

  const showsKeyFrameCount =
    sequential.enabled && sequential.mode === "key_frames";
  const showsOpeningFrame =
    sequential.enabled && sequential.mode === "last_frame";

  return (
    <div
      className="flex flex-col gap-2 rounded-lg bg-element-primary p-2"
      data-testid={`shot-sequential-${testIdSuffix}`}
    >
      <ShotSequentialModeDropdown
        continuation={
          sequential.enabled ? sequential.mode : SEQUENTIAL_CONTINUATION_OFF
        }
        isDisabled={isDisabled}
        onChange={(continuation) =>
          onChange(withSequentialContinuation(sequential, continuation))
        }
        testId={`shot-sequential-mode-${testIdSuffix}`}
      />

      <Text
        variant="xs"
        color="glyph-tertiary"
        data-testid={`shot-chain-position-${testIdSuffix}`}
      >
        {chainPositionLabel}
      </Text>

      {sequential.enabled && (
        <>
          {showsKeyFrameCount && (
            <ShotSequentialNumberInput
              label={t("script_project.sequential_key_frame_count.label")}
              value={sequential.num_select}
              min={MIN_SEQUENTIAL_KEY_FRAMES}
              max={MAX_SEQUENTIAL_KEY_FRAMES}
              step={1}
              isDisabled={isDisabled}
              onSave={(num_select) => onChange({ ...sequential, num_select })}
              testId={`shot-sequential-key-frames-${testIdSuffix}`}
            />
          )}

          {showsOpeningFrame && (
            <ShotSequentialOpeningFrameDropdown
              openingFrame={sequential.opening_frame}
              isDisabled={isDisabled}
              onChange={(opening_frame) =>
                onChange({ ...sequential, opening_frame })
              }
              testId={`shot-sequential-opening-frame-${testIdSuffix}`}
            />
          )}

          <label className="flex flex-col gap-1">
            <Text variant="xs" color="glyph-secondary">
              {t("script_project.sequential_prompt_appendix_input.label")}
            </Text>
            <Textarea
              className="min-h-16"
              autoResize
              resize="vertical"
              disabled={isDisabled}
              value={appendixText}
              placeholder={t(
                "script_project.sequential_prompt_appendix_input.placeholder"
              )}
              onChange={(event) => {
                setTypedAppendixText(event.target.value);
                onChange({
                  ...sequential,
                  prompt_appendix: event.target.value
                });
              }}
              onBlur={restoreDefaultWhenAppendixCleared}
              data-testid={`shot-sequential-appendix-${testIdSuffix}`}
            />
          </label>

          {hasOwnAppendix ? (
            <Button
              className="self-start text-xs text-glyph-secondary underline hover:text-glyph-primary disabled:opacity-50"
              isDisabled={isDisabled}
              onPress={resetAppendixToDefault}
              data-testid={`shot-sequential-appendix-reset-${testIdSuffix}`}
            >
              {t("script_project.sequential_prompt_reset_button.label")}
            </Button>
          ) : (
            defaultAppendixText && (
              <Text variant="xs" color="glyph-tertiary">
                {t("script_project.sequential_prompt_default_hint.label")}
              </Text>
            )
          )}

          <Text variant="xs" color="glyph-tertiary">
            {t("script_project.sequential_pin_hint.label")}
          </Text>
        </>
      )}
    </div>
  );
};
