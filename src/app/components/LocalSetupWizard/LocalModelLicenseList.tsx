import { Text } from "@components/Text";
import { Link as AriaLink } from "react-aria-components/Link";
import { useTranslation } from "react-i18next";

import type { LocalModelLicense } from "../../../../desktop/shared/localModelLicenses";

export const LocalModelLicenseList = ({
  licenses
}: {
  licenses: LocalModelLicense[];
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="sm" color="glyph-secondary">
        {t("localSetup.licenses.description")}
      </Text>

      <ul
        aria-label={t("localSetup.licenses.listLabel")}
        className="flex max-h-[236px] flex-col overflow-y-auto pr-1"
      >
        {licenses.map((license) => (
          <li
            key={license.huggingFaceRepo}
            className="flex items-center justify-between gap-3 border-b border-element-primary py-1.5"
          >
            <Text
              component="span"
              variant="sm"
              color="glyph-secondary"
              className="min-w-0"
            >
              {license.modelName}
            </Text>
            <AriaLink
              href={license.licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-right text-sm text-glyph-action-main underline"
            >
              {license.licenseName}
            </AriaLink>
          </li>
        ))}
      </ul>
    </>
  );
};
