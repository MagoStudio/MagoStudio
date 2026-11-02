import { Text } from "@components/Text";
import { Button } from "react-aria-components/Button";

type Props = {
  idea: string;
  isDisabled: boolean;
  onPress: () => void;
};

export const ScriptIdeaCard: React.FC<Props> = ({
  idea,
  isDisabled,
  onPress
}) => (
  <Button
    data-testid="script-project-idea-card"
    isDisabled={isDisabled}
    onPress={onPress}
    className="group w-full rounded-lg bg-element-primary p-3 text-left outline-hidden transition-colors hover:bg-element-primary-active data-[disabled]:opacity-50"
  >
    <Text
      variant="sm"
      color="glyph-secondary"
      className="group-hover:text-glyph-primary"
    >
      {idea}
    </Text>
  </Button>
);
