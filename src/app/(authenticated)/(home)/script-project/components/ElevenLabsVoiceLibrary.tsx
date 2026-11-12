import { Dropdown } from "@components/Dropdown";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { LoadingIndicator } from "@components/LoadingIndicator";
import { Text } from "@components/Text";
import { usePlayVoicePreview } from "@domains/voiceLibrary/usePlayVoicePreview";
import { useVoiceLibrary } from "@domains/voiceLibrary/useVoiceLibrary";
import { formatStockVoiceTags } from "@domains/voiceLibrary/utils/formatStockVoiceTags";
import {
  ALL_VOICE_AGES_FILTER_KEY,
  ALL_VOICE_GENDERS_FILTER_KEY,
  isStockVoiceMatchingFilters
} from "@domains/voiceLibrary/utils/isStockVoiceMatchingFilters";
import { resolveVoiceDisplayName } from "@domains/voiceLibrary/utils/resolveVoiceDisplayName";
import { StockVoice } from "@schemas/voiceLibrary";
import { cn } from "@utils";
import { useRef, useState } from "react";
import { Radio, RadioGroup } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { VOICE_LIBRARY_LANGUAGE_CODES } from "./utils/voiceLibraryLanguageCodes";

const ALL_LANGUAGES_KEY = "all";
const EVERY_LANGUAGE_BACKEND_CODE = "all";
const DEFAULT_LIBRARY_LANGUAGE_CODE = "en";

type Props = {
  isDisabled: boolean;
  selectedVoiceId: string | null;
  onSelectStockVoice: (stockVoice: StockVoice) => void;
};

export const ElevenLabsVoiceLibrary = ({
  isDisabled,
  selectedVoiceId,
  onSelectStockVoice
}: Props) => {
  const { t, i18n } = useTranslation();
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const { playVoicePreview } = usePlayVoicePreview();
  const [selectedLanguageKey, setSelectedLanguageKey] = useState<string>(
    DEFAULT_LIBRARY_LANGUAGE_CODE
  );
  const [selectedGenderKey, setSelectedGenderKey] = useState(
    ALL_VOICE_GENDERS_FILTER_KEY
  );
  const [selectedAgeKey, setSelectedAgeKey] = useState(
    ALL_VOICE_AGES_FILTER_KEY
  );
  const {
    data: voiceLibrary,
    isPending: isVoiceLibraryLoading,
    isError: didVoiceLibraryRequestFail
  } = useVoiceLibrary({
    languageCode:
      selectedLanguageKey === ALL_LANGUAGES_KEY
        ? EVERY_LANGUAGE_BACKEND_CODE
        : selectedLanguageKey
  });
  const genderDropdownItems = [
    {
      key: ALL_VOICE_GENDERS_FILTER_KEY,
      label: t("script_project.voice.eleven_labs_library.all_genders")
    },
    {
      key: "male",
      label: t("script_project.voice.eleven_labs_library.male_voices")
    },
    {
      key: "female",
      label: t("script_project.voice.eleven_labs_library.female_voices")
    }
  ];
  const ageDropdownItems = [
    {
      key: ALL_VOICE_AGES_FILTER_KEY,
      label: t("script_project.voice.eleven_labs_library.all_ages")
    },
    {
      key: "kids",
      label: t("script_project.voice.eleven_labs_library.kids_voices")
    },
    {
      key: "elderly",
      label: t("script_project.voice.eleven_labs_library.elderly_voices")
    }
  ];
  const languageDisplayNames = new Intl.DisplayNames([i18n.language], {
    type: "language"
  });
  const languageDropdownItems = [
    {
      key: ALL_LANGUAGES_KEY,
      label: t("script_project.voice.eleven_labs_library.all_languages")
    },
    ...VOICE_LIBRARY_LANGUAGE_CODES.map((languageCode) => ({
      key: languageCode,
      label: languageDisplayNames.of(languageCode) ?? languageCode
    }))
  ];
  const stockVoices = voiceLibrary?.library ?? [];
  const isVoiceLibraryUnavailable =
    (didVoiceLibraryRequestFail || !!voiceLibrary?.library_error) &&
    stockVoices.length === 0;
  const stockVoicesMatchingFilters = stockVoices.filter((stockVoice) =>
    isStockVoiceMatchingFilters(stockVoice, {
      genderFilterKey: selectedGenderKey,
      ageFilterKey: selectedAgeKey
    })
  );
  const hasNoMatchingVoices =
    !isVoiceLibraryLoading &&
    !isVoiceLibraryUnavailable &&
    stockVoicesMatchingFilters.length === 0;

  const playStockVoicePreview = (stockVoice: StockVoice) => {
    const previewAudio = previewAudioRef.current;
    if (!previewAudio) return;
    void playVoicePreview(previewAudio, {
      voiceId: stockVoice.voice_id,
      providerPreviewUrl: stockVoice.preview_url
    });
  };

  const selectStockVoice = (voiceId: string) => {
    const selectedStockVoice = stockVoices.find(
      (stockVoice) => stockVoice.voice_id === voiceId
    );
    if (!selectedStockVoice) return;
    onSelectStockVoice(selectedStockVoice);
    playStockVoicePreview(selectedStockVoice);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-element-primary bg-surface-primary p-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          <Dropdown
            className="w-32"
            aria-label={t(
              "script_project.voice.eleven_labs_library.age_dropdown.ariaLabel"
            )}
            items={ageDropdownItems}
            selectedKey={selectedAgeKey}
            onSelectionChange={(key) => setSelectedAgeKey(String(key))}
            isDisabled={isDisabled}
          />
          <Dropdown
            className="w-36"
            aria-label={t(
              "script_project.voice.eleven_labs_library.gender_dropdown.ariaLabel"
            )}
            items={genderDropdownItems}
            selectedKey={selectedGenderKey}
            onSelectionChange={(key) => setSelectedGenderKey(String(key))}
            isDisabled={isDisabled}
          />
          <Dropdown
            className="w-40"
            aria-label={t(
              "script_project.voice.eleven_labs_library.language_dropdown.ariaLabel"
            )}
            items={languageDropdownItems}
            selectedKey={selectedLanguageKey}
            onSelectionChange={(key) => setSelectedLanguageKey(String(key))}
            isDisabled={isDisabled}
          />
        </div>
      </div>
      <RadioGroup
        aria-label={t("script_project.voice.eleven_labs_library.title")}
        value={selectedVoiceId}
        onChange={selectStockVoice}
        isDisabled={isDisabled}
        className="relative flex max-h-96 flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-custom"
      >
        {isVoiceLibraryLoading && (
          <div className="flex justify-center py-6">
            <LoadingIndicator size="16" />
          </div>
        )}
        {isVoiceLibraryUnavailable && (
          <Text variant="xs" color="glyph-warning" className="py-6 text-center">
            {t("script_project.voice.eleven_labs_library.library_unavailable")}
          </Text>
        )}
        {hasNoMatchingVoices && (
          <Text
            variant="xs"
            color="glyph-tertiary"
            className="py-6 text-center"
          >
            {t("script_project.voice.eleven_labs_library.no_matching_voices")}
          </Text>
        )}
        {stockVoicesMatchingFilters.map((stockVoice) => {
          const stockVoiceName = resolveVoiceDisplayName(stockVoice);
          return (
            <Radio
              key={stockVoice.voice_id}
              value={stockVoice.voice_id}
              className={({ isSelected, isHovered, isFocusVisible }) =>
                cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 outline-hidden transition-colors",
                  isSelected
                    ? "border-glyph-action-main bg-element-primary-active"
                    : "border-element-primary bg-surface-secondary",
                  isHovered && !isSelected && "bg-element-primary",
                  isFocusVisible && "ring-1 ring-glyph-secondary ring-offset-1"
                )
              }
            >
              {({ isSelected }) => (
                <>
                  <span
                    className={cn(
                      "flex size-[1.125rem] shrink-0 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-transparent bg-element-tertiary-active"
                        : "border-glyph-tertiary"
                    )}
                  >
                    {isSelected && (
                      <span className="size-1.5 rounded-full bg-glyph-primary" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <Text variant="xs" weight="semibold">
                      {stockVoiceName}
                    </Text>
                    <Text variant="2xs" color="glyph-tertiary">
                      {formatStockVoiceTags(stockVoice.tags)}
                    </Text>
                  </span>
                  <span className="ml-auto shrink-0">
                    <IconActionButton
                      size="xs"
                      variant="transparent"
                      icon={<Icon iconSet="16" iconName="volume-up" />}
                      aria-label={t(
                        "script_project.voice.eleven_labs_library.play_preview_button.ariaLabel",
                        { name: stockVoiceName }
                      )}
                      onPress={() => playStockVoicePreview(stockVoice)}
                      data-testid={`library-voice-play-${stockVoice.voice_id}`}
                    />
                  </span>
                </>
              )}
            </Radio>
          );
        })}
      </RadioGroup>
      <audio ref={previewAudioRef} preload="none" />
    </div>
  );
};
