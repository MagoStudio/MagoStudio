import { Badge } from "@components/Badge";
import { useCutShotVersionRenderSettingsLabel } from "@domains/scriptProject/useCutShotVersionRenderSettingsLabel";
import { CutShotVersion } from "@schemas/scriptProject";

type Props = {
  version: Pick<CutShotVersion, "render_spec">;
  className?: string;
  testId?: string;
};

export const CutShotVersionRenderSettingsBadge: React.FC<Props> = ({
  version,
  className,
  testId
}) => {
  const renderSettingsLabel = useCutShotVersionRenderSettingsLabel(version);
  if (!renderSettingsLabel) return null;

  return (
    <Badge className={className} data-testid={testId}>
      {renderSettingsLabel}
    </Badge>
  );
};
