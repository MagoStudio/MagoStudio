import { FloatingTree } from "@floating-ui/react";

import { Menu } from "./Menu";
import { TwoLevelsDropdownCategory } from "./types";

export type { TwoLevelsDropdownCategory };

interface TwoLevelsDropdownProps {
  selectedKey: string;
  selectedLabel: string;
  categories: TwoLevelsDropdownCategory[];
  onSelectionChange: (key: string) => void;
  ariaLabel: string;
  className?: string;
  label?: string;
  testId?: string;
}

export const TwoLevelsDropdown: React.FC<TwoLevelsDropdownProps> = (props) => {
  return (
    <FloatingTree>
      <Menu {...props} />
    </FloatingTree>
  );
};
