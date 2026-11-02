/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync (FloatingTree event bus) */
import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingTree,
  useInteractions,
  useListNavigation,
  useRole
} from "@floating-ui/react";
import { useFloatingRefCallbacks } from "@hooks/useFloatingRefCallbacks";
import { cn } from "@utils";
import { useEffect, useRef, useState } from "react";

import { CategoryRow } from "./CategoryRow";
import { TwoLevelsDropdownCategory } from "./types";

const ROOT_OFFSET_PX = 2;
const ROOT_SHIFT_PADDING_PX = 8;

interface Props {
  selectedKey: string;
  selectedLabel: string;
  categories: TwoLevelsDropdownCategory[];
  onSelectionChange: (key: string) => void;
  ariaLabel: string;
  className?: string;
  label?: string;
  testId?: string;
}

export const Menu: React.FC<Props> = ({
  selectedKey,
  selectedLabel,
  categories,
  onSelectionChange,
  ariaLabel,
  className,
  label,
  testId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const tree = useFloatingTree();
  const nodeId = useFloatingNodeId();

  const itemsRef = useRef<Array<HTMLElement | null>>([]);

  const { refs, floatingStyles, context } = useFloating({
    nodeId,
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      if (!open) setActiveIndex(null);
    },
    placement: "bottom-start",
    middleware: [
      offset(ROOT_OFFSET_PX),
      flip(),
      shift({ padding: ROOT_SHIFT_PADDING_PX })
    ],
    whileElementsMounted: autoUpdate
  });
  const { setReferenceElement, setFloatingElement } =
    useFloatingRefCallbacks(refs);

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "menu" });
  const listNavigation = useListNavigation(context, {
    listRef: itemsRef,
    activeIndex,
    onNavigate: setActiveIndex
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, role, listNavigation]
  );

  useEffect(() => {
    if (!tree) return;
    const handleTreeClick = () => setIsOpen(false);
    tree.events.on("click", handleTreeClick);
    return () => {
      tree.events.off("click", handleTreeClick);
    };
  }, [tree]);

  const handleSelect = (key: string) => {
    onSelectionChange(key);
    setIsOpen(false);
  };

  return (
    <FloatingNode id={nodeId}>
      <button
        type="button"
        ref={setReferenceElement}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-testid={testId}
        className={cn(
          "flex flex-1 min-w-0 items-center justify-between text-glyph-secondary text-sm bg-element-primary px-2 h-8 rounded hover:text-glyph-primary outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary",
          "hover:[background-image:linear-gradient(0deg,var(--color-element-for-hover),var(--color-element-for-hover))]",
          "aria-expanded:ring-1 aria-expanded:ring-glyph-action-main!",
          className
        )}
        {...getReferenceProps()}
      >
        {label && (
          <Text
            component="span"
            variant="sm"
            color="glyph-tertiary"
            select="none"
            className="shrink-0 whitespace-nowrap mr-1.5"
          >
            {label}
          </Text>
        )}
        <Text
          component="span"
          variant="sm"
          color="inherit"
          className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left"
        >
          {selectedLabel}
        </Text>
        <span aria-hidden="true" className="ml-2.5 shrink-0">
          <Icon iconSet="16" iconName="chevron-down" />
        </span>
      </button>
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={0}
          >
            <div
              ref={setFloatingElement}
              style={floatingStyles}
              aria-label={ariaLabel}
              className="bg-element-tertiary rounded p-2 w-[216px] z-50 outline-none"
              {...getFloatingProps()}
            >
              {categories.map((category, index) => (
                <CategoryRow
                  key={category.key}
                  category={category}
                  index={index}
                  parentActiveIndex={activeIndex}
                  getParentItemProps={getItemProps}
                  setParentItemRef={(node) => {
                    itemsRef.current[index] = node;
                  }}
                  selectedKey={selectedKey}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </FloatingNode>
  );
};
