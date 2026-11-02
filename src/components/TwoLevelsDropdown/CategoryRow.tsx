/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync (FloatingTree event bus) */
import { Badge } from "@components/Badge";
import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFloatingTree,
  useHover,
  useInteractions,
  useListNavigation,
  useMergeRefs,
  useRole
} from "@floating-ui/react";
import { useFloatingRefCallbacks } from "@hooks/useFloatingRefCallbacks";
import { cn } from "@utils";
import { useEffect, useRef, useState } from "react";

import { TwoLevelsDropdownCategory } from "./types";

const SUBMENU_OFFSET_PX = 4;
const SUBMENU_SHIFT_PADDING_PX = 8;
const SUBMENU_VIEWPORT_PADDING_PX = 8;
const SUBMENU_SAFE_POLYGON_BUFFER_PX = 24;
const SUBMENU_HOVER_OPEN_DELAY_MS = 75;

interface Props {
  category: TwoLevelsDropdownCategory;
  index: number;
  parentActiveIndex: number | null;
  getParentItemProps: (
    userProps?: React.HTMLProps<HTMLElement>
  ) => Record<string, unknown>;
  setParentItemRef: (node: HTMLElement | null) => void;
  selectedKey: string;
  onSelect: (key: string) => void;
}

export const CategoryRow: React.FC<Props> = ({
  category,
  index,
  parentActiveIndex,
  getParentItemProps,
  setParentItemRef,
  selectedKey,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const tree = useFloatingTree();
  const nodeId = useFloatingNodeId();
  const parentId = useFloatingParentNodeId();

  const itemsRef = useRef<Array<HTMLElement | null>>([]);

  const { refs, floatingStyles, context } = useFloating({
    nodeId,
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      if (!open) setActiveIndex(null);
      if (open) tree?.events.emit("menuopen", { parentId, nodeId });
    },
    placement: "right-start",
    middleware: [
      offset(SUBMENU_OFFSET_PX),
      flip(),
      shift({ padding: SUBMENU_SHIFT_PADDING_PX }),
      size({
        padding: SUBMENU_VIEWPORT_PADDING_PX,
        apply: ({ availableHeight, elements }) => {
          elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
        }
      })
    ],
    whileElementsMounted: autoUpdate
  });
  const { setReferenceElement, setFloatingElement } =
    useFloatingRefCallbacks(refs);

  const hover = useHover(context, {
    delay: { open: SUBMENU_HOVER_OPEN_DELAY_MS },
    handleClose: safePolygon({ buffer: SUBMENU_SAFE_POLYGON_BUFFER_PX })
  });
  const click = useClick(context, { ignoreMouse: true });
  const dismiss = useDismiss(context, { bubbles: true });
  const role = useRole(context, { role: "menu" });
  const listNavigation = useListNavigation(context, {
    listRef: itemsRef,
    activeIndex,
    nested: true,
    onNavigate: setActiveIndex
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [hover, click, dismiss, role, listNavigation]
  );

  useEffect(() => {
    if (!tree) return;
    const handleTreeClick = () => setIsOpen(false);
    const handleSiblingOpen = (event: {
      nodeId: string;
      parentId: string | null;
    }) => {
      if (event.parentId === parentId && event.nodeId !== nodeId) {
        setIsOpen(false);
      }
    };
    tree.events.on("click", handleTreeClick);
    tree.events.on("menuopen", handleSiblingOpen);
    return () => {
      tree.events.off("click", handleTreeClick);
      tree.events.off("menuopen", handleSiblingOpen);
    };
  }, [tree, nodeId, parentId]);

  const triggerRef = useMergeRefs([setReferenceElement, setParentItemRef]);

  return (
    <FloatingNode id={nodeId}>
      <button
        type="button"
        ref={triggerRef}
        role="menuitem"
        tabIndex={parentActiveIndex === index ? 0 : -1}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          "w-full h-8 pl-2 rounded text-sm text-glyph-primary flex items-center justify-between outline-none focus:bg-element-primary",
          isOpen && "bg-element-primary"
        )}
        {...getReferenceProps(getParentItemProps())}
      >
        <Text component="span" variant="sm" color="glyph-primary">
          {category.label}
        </Text>
        <Icon
          iconSet="16"
          iconName="chevron-right"
          className="text-glyph-tertiary"
        />
      </button>
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={-1}
            returnFocus={false}
          >
            <div
              ref={setFloatingElement}
              style={floatingStyles}
              aria-label={category.label}
              className="bg-element-tertiary rounded p-2 w-[364px] overflow-y-auto scrollbar-custom z-50 outline-none"
              {...getFloatingProps()}
            >
              {category.items.map((item, itemIndex) => {
                const isSelected = item.key === selectedKey;
                const isDisabled = item.isDisabled === true;
                return (
                  <button
                    type="button"
                    key={item.key}
                    disabled={isDisabled}
                    ref={(node) => {
                      itemsRef.current[itemIndex] = node;
                    }}
                    role="menuitem"
                    tabIndex={activeIndex === itemIndex ? 0 : -1}
                    aria-label={item.label}
                    aria-disabled={isDisabled}
                    className={cn(
                      "w-full flex gap-1 items-start py-2 pr-1.5 rounded outline-none border-l-2 border-transparent text-left",
                      !isDisabled &&
                        "hover:bg-element-primary focus:bg-element-primary",
                      isDisabled && "opacity-50 cursor-not-allowed",
                      isSelected &&
                        "bg-element-primary border-glyph-action-main"
                    )}
                    {...getItemProps({
                      onClick: () => {
                        if (isDisabled) return;
                        onSelect(item.key);
                        tree?.events.emit("click");
                      }
                    })}
                  >
                    <div className="w-8 shrink-0 flex items-center justify-center pt-0.5">
                      <Icon
                        iconSet="16"
                        iconName="checkmark"
                        className={cn(
                          "text-glyph-secondary",
                          !isSelected && "opacity-0"
                        )}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <Text
                        component="span"
                        variant="sm"
                        weight="bold"
                        color="glyph-primary"
                      >
                        {item.label}
                      </Text>
                      {(isDisabled && item.disabledReason
                        ? item.disabledReason
                        : item.description) && (
                        <Text
                          component="span"
                          variant="sm"
                          color="glyph-tertiary"
                        >
                          {isDisabled && item.disabledReason
                            ? item.disabledReason
                            : item.description}
                        </Text>
                      )}
                    </div>
                    <div className="ml-auto flex shrink-0 items-start gap-1">
                      {item.providerBadge && (
                        <Badge
                          glyphColor="glyph-secondary"
                          className="mt-0.5 bg-element-primary"
                        >
                          {item.providerBadge}
                        </Badge>
                      )}
                      {item.badge && (
                        <Badge
                          glyphColor="glyph-secondary"
                          className="mt-0.5 bg-element-primary"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </FloatingNode>
  );
};
