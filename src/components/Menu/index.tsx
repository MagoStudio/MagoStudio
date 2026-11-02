import {
  useFloating,
  shift,
  flip,
  offset,
  FloatingPortal
} from "@floating-ui/react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useFloatingRefCallbacks } from "@hooks/useFloatingRefCallbacks";
import { cn } from "@utils";
import { Fragment, MutableRefObject } from "react";

type MenuRenderPropArg = {
  open: boolean;
  close: (
    focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>
  ) => void;
};

type Props = {
  button?: React.ReactNode;
  children?: React.ReactNode | ((bag: MenuRenderPropArg) => React.ReactElement);
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
  disableGutters?: boolean;
  placement?:
    | "top"
    | "right"
    | "bottom"
    | "left"
    | "top-start"
    | "right-start"
    | "bottom-start"
    | "left-start"
    | "top-end"
    | "right-end"
    | "bottom-end"
    | "left-end";
} & Omit<React.HTMLAttributes<HTMLElement>, "children">;

export const Menu: React.FC<Props> = ({
  button,
  children,
  className,
  buttonClassName,
  panelClassName,
  disableGutters,
  placement = "bottom"
}) => {
  const { refs, floatingStyles } = useFloating({
    placement: placement,
    middleware: [offset(), flip(), shift({ padding: 12 })]
  });
  const { setReferenceElement, setFloatingElement } =
    useFloatingRefCallbacks(refs);

  const trigger = (
    <PopoverButton as={Fragment} ref={setReferenceElement}>
      {button}
    </PopoverButton>
  );

  return (
    <Popover className={className}>
      {buttonClassName ? (
        <div className={buttonClassName}>{trigger}</div>
      ) : (
        trigger
      )}
      <FloatingPortal>
        <PopoverPanel
          ref={setFloatingElement}
          style={floatingStyles}
          className={cn(
            "z-menu overflow-auto m-0 mt-1 px-0 py-1 max-w-[calc(100vw-2rem)] min-w-0 w-fit rounded bg-surface-primary shadow-lg absolute right-0 focus:outline-0 focus-visible:outline-0 scrollbar-custom",
            disableGutters && "py-0",
            panelClassName
          )}
        >
          {children}
        </PopoverPanel>
      </FloatingPortal>
    </Popover>
  );
};
