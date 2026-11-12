import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { useModalPortalContainer } from "@components/Modal/ModalPortalContext";
import { Popover } from "@components/Popover";
import { DialogTrigger } from "react-aria-components/Dialog";

export const ModelSettingsInfoButton = ({
  ariaLabel,
  testId,
  children
}: {
  ariaLabel: string;
  testId: string;
  children: React.ReactNode;
}) => {
  const portalContainer = useModalPortalContainer();
  return (
    <DialogTrigger>
      <IconActionButton
        aria-label={ariaLabel}
        icon={<Icon iconSet="16" iconName="info" />}
        data-testid={testId}
      />
      <Popover
        placement="bottom"
        isNonModal={false}
        variant="neutral"
        portalContainer={portalContainer}
      >
        <div className="flex max-h-[70vh] w-96 flex-col gap-3 overflow-y-auto whitespace-normal scrollbar-custom">
          {children}
        </div>
      </Popover>
    </DialogTrigger>
  );
};
