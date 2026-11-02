import { Text } from "@components/Text";
import { useCutShotVersionRenderSettingsLabel } from "@domains/scriptProject/useCutShotVersionRenderSettingsLabel";
import { CutShotVersion } from "@schemas/scriptProject";

type Props = {
  version: Pick<CutShotVersion, "render_spec">;
  className?: string;
  testId?: string;
};

export const CutShotVersionRenderSettingsNote: React.FC<Props> = ({
  version,
  className,
  testId
}) => {
  const renderSettingsLabel = useCutShotVersionRenderSettingsLabel(version);
  if (!renderSettingsLabel) return null;

  return (
    <Text
      variant="2xs"
      color="glyph-tertiary"
      className={className}
      data-testid={testId}
    >
      {renderSettingsLabel}
    </Text>
  );
};
