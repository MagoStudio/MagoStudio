"use client";

import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Input } from "@components/Input";
import { PROJECT_NAME_MAX_LENGTH } from "@domains/project/constants";
import { useInlineRename } from "@home/components/dashboard/ProjectModal/hooks/useInlineRename";
import { cn } from "@utils";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useTranslation } from "react-i18next";

const DOUBLE_CLICK_DELAY_MS = 250;

export interface InlineEditableTextRef {
  startEditing: () => void;
}

interface InlineEditableTextProps {
  value: string;
  onSave: (newName: string) => void;
  maxLength?: number;
  inputClassName?: string;
  stopPropagation?: boolean;
  trigger?: "click" | "doubleClick";
  onEditingChange?: (isEditing: boolean) => void;
  onSingleClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const InlineEditableText = forwardRef<
  InlineEditableTextRef,
  InlineEditableTextProps
>(
  (
    {
      value,
      onSave,
      maxLength = PROJECT_NAME_MAX_LENGTH,
      inputClassName,
      stopPropagation = false,
      trigger = "doubleClick",
      onEditingChange,
      onSingleClick,
      children,
      className
    },
    ref
  ) => {
    const { t } = useTranslation();
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const {
      isEditing,
      editValue,
      setEditValue,
      inputRef,
      registerInput,
      startEditing: startEditingRaw,
      handleSave: handleSaveRaw,
      handleKeyDown: handleKeyDownRaw
    } = useInlineRename(value, onSave);

    const startEditingRef = useRef<(e?: React.MouseEvent) => void>(() => {});
    startEditingRef.current = (e?: React.MouseEvent) => {
      startEditingRaw(e);
      onEditingChange?.(true);
    };
    const startEditing = (e?: React.MouseEvent) => startEditingRef.current(e);

    useImperativeHandle(
      ref,
      () => ({ startEditing: () => startEditingRef.current() }),
      []
    );

    const handleSave = () => {
      handleSaveRaw();
      onEditingChange?.(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      handleKeyDownRaw(e);
      if (e.key === "Escape") {
        onEditingChange?.(false);
      }
    };

    // oxlint-disable-next-line react-hooks/exhaustive-deps -- cleanup only on unmount
    useEffect(() => {
      return () => {
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }
      };
    }, []);

    if (isEditing) {
      return (
        <div
          className={cn(
            "flex items-center gap-1 border border-glyph-action-main bg-element-primary rounded px-2 h-8",
            className
          )}
        >
          <Input
            ref={registerInput}
            className={cn(
              "h-6 flex-1 min-w-0 border-none bg-transparent text-glyph-primary focus-visible:outline-none",
              inputClassName
            )}
            maxLength={maxLength}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
          />
          <IconActionButton
            icon={<Icon iconSet="16" iconName="return" />}
            onPress={() => inputRef.current?.blur()}
            className="shrink-0"
            aria-label={t("actions.confirm_rename.label")}
          />
        </div>
      );
    }

    const handleDoubleClickTriggerClick = onSingleClick
      ? () => {
          if (clickTimerRef.current) return;
          clickTimerRef.current = setTimeout(() => {
            clickTimerRef.current = null;
            onSingleClick();
          }, DOUBLE_CLICK_DELAY_MS);
        }
      : undefined;

    const handleDoubleClick = () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      startEditing();
    };

    const triggerProps =
      trigger === "click"
        ? { onClick: startEditing }
        : {
            onDoubleClick: handleDoubleClick,
            ...(handleDoubleClickTriggerClick && {
              onClick: handleDoubleClickTriggerClick
            })
          };

    return (
      <button
        type="button"
        className={cn("w-full text-left cursor-text", className)}
        {...triggerProps}
      >
        {children}
      </button>
    );
  }
);

InlineEditableText.displayName = "InlineEditableText";
