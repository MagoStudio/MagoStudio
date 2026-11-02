import { Button as AriaButton } from "react-aria-components/Button";

type Props = {
  onPress: () => void;
};

export const SidebarLogoMark: React.FC<Props> = ({ onPress }) => (
  <AriaButton
    className="inline-flex shrink-0 items-center justify-center p-0 m-0"
    onPress={onPress}
    type="button"
  >
    <img
      alt="Mago"
      src="/logo-mark.svg"
      className="block size-[23px] shrink-0"
    />
  </AriaButton>
);
