import { Button as AriaButton } from "react-aria-components/Button";

type Props = {
  onPress: () => void;
};

export const SidebarLogo: React.FC<Props> = ({ onPress }) => (
  <AriaButton
    className="flex shrink-0 items-center w-auto p-0 m-0"
    onPress={onPress}
    type="button"
  >
    <img alt="Mago" src="/logo.svg" className="block shrink-0 h-[23px]" />
  </AriaButton>
);
