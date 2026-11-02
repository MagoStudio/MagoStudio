import { Badge } from "@components/Badge";
import { Icon } from "@components/Icon";
import { Popover } from "@components/Popover";
import { Text } from "@components/Text";
import { formatMetricRows } from "@domains/plan/utils/formatMetricRows";
import { PlanMetric } from "@domains/plan/utils/getMetricChip";
import { useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

interface PlanMetricChipProps {
  metric: PlanMetric;
}

const CHIP_CONFIG = {
  pass: {
    glyphColor: "glyph-success" as const,
    iconName: "checkmark" as const
  },
  fail: { glyphColor: "glyph-error" as const, iconName: "cross" as const },
  unscored: {
    glyphColor: "glyph-secondary" as const,
    iconName: "info" as const
  }
};

export const PlanMetricChip: React.FC<PlanMetricChipProps> = ({ metric }) => {
  const { t } = useTranslation();
  const config = CHIP_CONFIG[metric.kind];
  const rows = formatMetricRows(metric.details);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex items-center gap-1">
      <Badge
        glyphColor={config.glyphColor}
        startIcon={<Icon iconSet="16" iconName={config.iconName} />}
      >
        {t(`plan.metric.${metric.kind}.label`)}
      </Badge>
      {rows.length > 0 && (
        <>
          <AriaButton
            ref={infoButtonRef}
            aria-label={t("plan.metric.details.label")}
            aria-expanded={detailsOpen}
            onPress={() => setDetailsOpen((prev) => !prev)}
            className="flex items-center justify-center rounded-full p-0.5 text-glyph-tertiary hover:text-glyph-secondary cursor-pointer outline-hidden"
          >
            <Icon iconSet="16" iconName="info" />
          </AriaButton>
          <Popover
            isOpen={detailsOpen}
            onOpenChange={setDetailsOpen}
            triggerRef={infoButtonRef}
            placement="top"
            isNonModal={false}
          >
            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
              <Text variant="xs" weight="semibold" color="glyph-primary-on-pic">
                {t("plan.metric.details.label")}
              </Text>
              {rows.map((row) => (
                <div key={row.label} className="flex gap-2 text-xs">
                  <Text
                    variant="xs"
                    color="glyph-secondary"
                    className="shrink-0"
                  >
                    {row.label}
                  </Text>
                  <Text
                    variant="xs"
                    color="glyph-primary-on-pic"
                    className="break-all"
                  >
                    {row.value}
                  </Text>
                </div>
              ))}
            </div>
          </Popover>
        </>
      )}
    </div>
  );
};
