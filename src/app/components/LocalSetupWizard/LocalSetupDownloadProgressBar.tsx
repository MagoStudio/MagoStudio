import { LinearProgress } from "@components/LinearProgress";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

const BYTES_PER_GIB = 1_073_741_824;

export const LocalSetupDownloadProgressBar = ({
  receivedBytes,
  totalBytes
}: {
  receivedBytes: number;
  totalBytes: number;
}) => {
  const { t } = useTranslation();
  return (
    <>
      <LinearProgress
        size="lg"
        value={receivedBytes}
        totalValue={Math.max(totalBytes, 1)}
        color="element-additional-active"
        className="min-w-0 flex-none rounded-full bg-element-tertiary"
      />
      <Text variant="sm" color="glyph-secondary">
        {t("localSetup.download.downloadedSize", {
          received: (receivedBytes / BYTES_PER_GIB).toFixed(1),
          total: (totalBytes / BYTES_PER_GIB).toFixed(1)
        })}
      </Text>
    </>
  );
};
