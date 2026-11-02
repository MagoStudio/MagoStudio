import { LinearProgress } from "@components/LinearProgress";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type {
  LocalSetupHardwareReport,
  LocalSetupHardwareVerdict
} from "../../../../desktop/shared/contracts";

import { LocalSetupDetailRow } from "./LocalSetupDetailRow";
import { LocalSetupStatusMark } from "./LocalSetupStatusMark";
import { LocalSetupWizardActions } from "./LocalSetupWizardActions";
import { LocalSetupWizardCard } from "./LocalSetupWizardCard";

const CHECKING_PROGRESS_PERCENTAGE = 45;

export const LocalSetupHardwareStep = ({
  outcome,
  report,
  onContinue,
  onUseCloud
}: {
  outcome: "checking" | LocalSetupHardwareVerdict;
  report: LocalSetupHardwareReport;
  onContinue: () => void;
  onUseCloud: () => void;
}) => {
  const { t } = useTranslation();

  const graphicsCardLabel = t("localSetup.hardware.graphicsCard", {
    defaultValue: "Graphics card"
  });
  const videoMemoryLabel = t("localSetup.hardware.videoMemory", {
    defaultValue: "Video memory"
  });
  const systemMemoryLabel = t("localSetup.hardware.systemMemory", {
    defaultValue: "Memory"
  });

  if (outcome === "checking") {
    const checkingValue = t("localSetup.hardware.checkingValue", {
      defaultValue: "Checking…"
    });

    return (
      <LocalSetupWizardCard>
        <Text variant="lg">
          {t("localSetup.hardware.checkingTitle", {
            defaultValue: "Checking your hardware…"
          })}
        </Text>

        <LocalSetupDetailRow
          label={graphicsCardLabel}
          value={checkingValue}
          tone="muted"
        />
        <LocalSetupDetailRow
          label={videoMemoryLabel}
          value={checkingValue}
          tone="muted"
        />
        <LocalSetupDetailRow
          label={systemMemoryLabel}
          value={checkingValue}
          tone="muted"
        />

        <LinearProgress
          size="lg"
          value={CHECKING_PROGRESS_PERCENTAGE}
          totalValue={100}
          color="element-additional-active"
          className="min-w-0 flex-none rounded-full bg-element-tertiary"
        />
      </LocalSetupWizardCard>
    );
  }

  const gpuList = report.graphicsCards && (
    <div className="flex flex-col gap-2">
      {report.graphicsCards.map((gpu, index) => (
        <LocalSetupDetailRow
          key={index}
          label={gpu.selected ? "Selected GPU" : "GPU"}
          value={`${gpu.name} - ${gpu.videoMemoryLabel}`}
          tone={gpu.selected ? "success" : "muted"}
        />
      ))}
      {report.graphicsCards.length > 0 && (
        <Text variant="xs" color="glyph-secondary">
          Hardware check uses the GPU with the most dedicated VRAM. ComfyUI
          controls which GPU renders.
        </Text>
      )}
    </div>
  );

  if (outcome === "ready") {
    return (
      <LocalSetupWizardCard>
        <div className="flex items-center gap-2">
          <LocalSetupStatusMark outcome="success" />
          <Text component="span" variant="lg">
            {t("localSetup.hardware.readyTitle", {
              defaultValue: "Your computer can run Mago locally"
            })}
          </Text>
        </div>

        <LocalSetupDetailRow
          label={graphicsCardLabel}
          value={report.graphicsCardName}
          tone="success"
        />
        <LocalSetupDetailRow
          label={videoMemoryLabel}
          value={report.videoMemoryLabel}
          tone="success"
        />
        <LocalSetupDetailRow
          label={systemMemoryLabel}
          value={report.systemMemoryLabel}
          tone="success"
        />

        {gpuList}
        <LocalSetupWizardActions
          primaryLabel={t("localSetup.hardware.continue", {
            defaultValue: "Continue"
          })}
          onPrimaryPress={onContinue}
        />
      </LocalSetupWizardCard>
    );
  }

  if (outcome === "limited") {
    return (
      <LocalSetupWizardCard>
        <div className="flex items-center gap-2">
          <LocalSetupStatusMark outcome="warning" />
          <Text component="span" variant="lg">
            {t("localSetup.hardware.limitedTitle", {
              defaultValue: "Mago will run, with limits"
            })}
          </Text>
        </div>

        <Text variant="sm" color="glyph-secondary">
          {t("localSetup.hardware.limitedDescription", {
            defaultValue:
              "Your graphics card has {{videoMemory}} of video memory. Smaller models run here. Larger ones stay on Mago cloud.",
            videoMemory: report.videoMemoryLabel
          })}
        </Text>

        <LocalSetupDetailRow
          label={graphicsCardLabel}
          value={report.graphicsCardName}
        />
        <LocalSetupDetailRow
          label={videoMemoryLabel}
          value={report.videoMemoryLabel}
          tone="warning"
        />
        <LocalSetupDetailRow
          label={systemMemoryLabel}
          value={report.systemMemoryLabel}
          tone="success"
        />

        {gpuList}
        <LocalSetupWizardActions
          primaryLabel={t("localSetup.hardware.continueAnyway", {
            defaultValue: "Continue anyway"
          })}
          onPrimaryPress={onContinue}
          secondaryLabel={t("localSetup.hardware.useCloud", {
            defaultValue: "Use Mago cloud"
          })}
          onSecondaryPress={onUseCloud}
        />
      </LocalSetupWizardCard>
    );
  }

  return (
    <LocalSetupWizardCard>
      <Text variant="lg">
        {t("localSetup.hardware.blockedTitle", {
          defaultValue: "This computer can't run Mago locally"
        })}
      </Text>

      <Text variant="sm" color="glyph-secondary">
        {t("localSetup.hardware.blockedDescription", {
          defaultValue:
            "Local rendering needs an NVIDIA graphics card with at least 8 GB of video memory. You can still render everything on Mago cloud."
        })}
      </Text>

      <LocalSetupDetailRow
        label={graphicsCardLabel}
        value={report.graphicsCardName}
        tone="error"
      />
      <LocalSetupDetailRow
        label={videoMemoryLabel}
        value={report.videoMemoryLabel}
        tone="error"
      />

      {gpuList}
      <LocalSetupWizardActions
        primaryLabel={t("localSetup.hardware.useCloud", {
          defaultValue: "Use Mago cloud"
        })}
        onPrimaryPress={onUseCloud}
      />
    </LocalSetupWizardCard>
  );
};
