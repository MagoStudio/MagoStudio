import { Icon } from "@components/Icon";
import { useModalPortalContainer } from "@components/Modal/ModalPortalContext";
import { Text } from "@components/Text";
import { Button } from "react-aria-components/Button";
import {
  Header,
  ListBox,
  ListBoxItem,
  ListBoxSection
} from "react-aria-components/ListBox";
import { Popover } from "react-aria-components/Popover";
import { Select, SelectValue } from "react-aria-components/Select";
import { useTranslation } from "react-i18next";

import type {
  ModelFileChoice,
  RecommendedModelFile
} from "../../../../../../../desktop/shared/modelSettings";

import { listLocalModelFilesExceptRecommended } from "./listLocalModelFilesExceptRecommended";
import { SettingsStatusMark } from "./SettingsStatusMark";

const optionClassName =
  "flex cursor-pointer items-center gap-2 rounded px-3 py-2 break-all outline-hidden data-focused:not-data-selected:bg-glyph-primary/5 data-selected:bg-element-primary";

const sectionHeaderClassName = "px-3 pt-2 pb-1";

export const ModelFileSelect = ({
  value,
  onChange,
  disabled,
  recommendedFile,
  choices
}: {
  value: string;
  onChange: (filename: string) => void;
  disabled: boolean;
  recommendedFile: RecommendedModelFile;
  choices: ModelFileChoice[];
}) => {
  const { t } = useTranslation();
  const portalContainer = useModalPortalContainer();
  const localFiles = listLocalModelFilesExceptRecommended(
    choices,
    recommendedFile
  );
  const areFileNodesMissing = (filename: string) =>
    choices.some(
      (choice) => choice.filename === filename && choice.missingNodes.length > 0
    );
  const isLocalFileChecked = (filename: string) =>
    localFiles.some(
      (file) => file.filename === filename && file.hasPassedModelCheck
    );
  const renderFileLabel = (filename: string) => {
    const isRecommendedFile = filename === recommendedFile.filename;
    const isRecommendedFileInstalled =
      isRecommendedFile && recommendedFile.isInstalled;
    const isRecommendedFileMissing =
      isRecommendedFile && !recommendedFile.isInstalled;
    const hasGreenCheck =
      (isRecommendedFileInstalled || isLocalFileChecked(filename)) &&
      !areFileNodesMissing(filename);
    return (
      <span className="flex min-w-0 items-center gap-2">
        {hasGreenCheck && (
          <SettingsStatusMark
            ready
            label={
              isRecommendedFile
                ? t("modelSettings.fileInstalled", { file: filename })
                : t("modelSettings.filePassedCheck", { file: filename })
            }
          />
        )}
        <Text component="span" variant="sm" className="min-w-0 break-all">
          {filename}
        </Text>
        {isRecommendedFileMissing && (
          <Text component="span" variant="2xs" color="glyph-warning">
            {t("modelSettings.notInstalled")}
          </Text>
        )}
      </span>
    );
  };
  return (
    <Select
      aria-label={t("modelSettings.file")}
      placeholder={t("modelSettings.selectExistingFile")}
      selectedKey={value || null}
      onSelectionChange={(key) => {
        if (typeof key === "string") onChange(key);
      }}
      isDisabled={disabled}
    >
      <Button className="flex w-full items-center justify-between gap-2 rounded bg-element-primary px-3 py-2 text-left text-sm text-glyph-primary disabled:opacity-50">
        <SelectValue className="min-w-0 data-placeholder:text-glyph-tertiary">
          {({ isPlaceholder, defaultChildren }) =>
            isPlaceholder ? defaultChildren : renderFileLabel(value)
          }
        </SelectValue>
        <Icon iconSet="16" iconName="chevron-down" />
      </Button>
      <Popover
        UNSTABLE_portalContainer={portalContainer}
        style={{ width: "var(--trigger-width)" }}
        className="max-h-96 overflow-auto"
      >
        <ListBox className="rounded bg-element-tertiary p-1 text-sm text-glyph-primary">
          <ListBoxSection>
            <Header className={sectionHeaderClassName}>
              <Text variant="2xs" color="glyph-tertiary">
                {t("modelSettings.recommendedFileSection")}
              </Text>
            </Header>
            <ListBoxItem
              key={recommendedFile.filename}
              id={recommendedFile.filename}
              textValue={recommendedFile.filename}
              className={optionClassName}
            >
              {renderFileLabel(recommendedFile.filename)}
            </ListBoxItem>
          </ListBoxSection>
          {localFiles.length > 0 && (
            <ListBoxSection>
              <Header className={sectionHeaderClassName}>
                <Text variant="2xs" color="glyph-tertiary">
                  {t("modelSettings.localFilesSection")}
                </Text>
              </Header>
              {localFiles.map((file) => (
                <ListBoxItem
                  key={file.filename}
                  id={file.filename}
                  textValue={file.filename}
                  className={optionClassName}
                >
                  {renderFileLabel(file.filename)}
                </ListBoxItem>
              ))}
            </ListBoxSection>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
};
