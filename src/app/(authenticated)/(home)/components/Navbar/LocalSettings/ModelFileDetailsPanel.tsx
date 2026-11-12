import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type { ModelFileChoice } from "../../../../../../../desktop/shared/modelSettings";

import { ModelOperationDetails } from "./ModelOperationDetails";
import { ModelOperationStatus } from "./ModelOperationStatus";
import type { ModelSettingsOperation } from "./modelSettingsOperation";

export const ModelFileDetailsPanel = ({
  pickedFile,
  operation,
  busy,
  canTestCandidateLoad,
  onLoad,
  onHash
}: {
  pickedFile: Pick<
    ModelFileChoice,
    "path" | "sourceUrl" | "expectedSha256" | "actualSha256"
  >;
  operation: ModelSettingsOperation | null;
  busy: boolean;
  canTestCandidateLoad: boolean;
  onLoad: () => void;
  onHash: () => void;
}) => {
  const { t } = useTranslation();
  const ignorePressWhileBusyAndKeepFocusInPopover = () => undefined;
  return (
    <>
      <ModelOperationDetails
        operation={operation}
        slots={["useFile", "testCandidate", "hash"]}
      />
      <Text variant="2xs" color="glyph-tertiary">
        {t("modelSettings.compatibilityHint")}
      </Text>
      <div className="flex flex-col gap-1">
        <Text variant="2xs" color="glyph-tertiary" className="break-all">
          {t("modelSettings.path", {
            value: pickedFile.path ?? t("modelSettings.remotePath")
          })}
        </Text>
        <Text variant="2xs" color="glyph-tertiary" className="break-all">
          {t("modelSettings.url", {
            value: pickedFile.sourceUrl ?? t("modelSettings.unknown")
          })}
        </Text>
        <Text variant="2xs" color="glyph-tertiary" className="break-all">
          {t("modelSettings.expectedHash", {
            value: pickedFile.expectedSha256 ?? t("modelSettings.unknown")
          })}
        </Text>
        <Text variant="2xs" color="glyph-tertiary" className="break-all">
          {t("modelSettings.actualHash", {
            value: pickedFile.actualSha256 ?? t("modelSettings.notComputed")
          })}
        </Text>
      </div>
      <div className="flex flex-wrap gap-2">
        <MainButton
          size="sm"
          colorScheme="secondary"
          isDisabled={busy || !canTestCandidateLoad}
          onDisabledPress={ignorePressWhileBusyAndKeepFocusInPopover}
          onPress={onLoad}
        >
          {t("modelSettings.testCandidate")}
        </MainButton>
        <MainButton
          size="sm"
          colorScheme="secondary"
          isDisabled={busy || !pickedFile.path}
          onDisabledPress={ignorePressWhileBusyAndKeepFocusInPopover}
          onPress={onHash}
        >
          {t("modelSettings.computeHash")}
        </MainButton>
      </div>
      <ModelOperationStatus
        operation={operation}
        slots={["testCandidate", "hash"]}
      />
    </>
  );
};
