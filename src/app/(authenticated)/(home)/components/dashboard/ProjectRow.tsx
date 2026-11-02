"use client";

import { Icon } from "@components/Icon";
import { InlineEditableText } from "@components/InlineEditableText";
import { Skeleton } from "@components/Skeleton";
import { Text } from "@components/Text";
import { useMountEffect } from "@hooks/useMountEffect";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ProjectPreviewImage } from "./ProjectPreviewImage";

const DOUBLE_CLICK_THRESHOLD_MS = 250;

type LoadingProps = {
  isLoading: true;
  id?: never;
  name?: never;
  imageUrl?: never;
  onClick?: never;
  onDelete?: never;
  onRename?: never;
};

type LoadedProps = {
  isLoading?: false;
  id: string;
  name: string;
  imageUrl: string;
  onClick: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onRename?: (id: string, newName: string) => void;
};

type Props = LoadingProps | LoadedProps;

export const ProjectRow: React.FC<Props> = ({
  id,
  name,
  imageUrl,
  onClick,
  onDelete,
  onRename,
  isLoading
}: Props) => {
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);

  const handleRenameProject = (newName: string) => {
    if (onRename && id) {
      onRename(id, newName);
    }
  };

  const clickTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useMountEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 px-2 py-[6px] rounded">
        <Skeleton
          variant="rounded"
          width={57}
          height={32}
          className="shrink-0 rounded!"
        />
        <Skeleton variant="rectangular" width="60%" height={16} />
      </div>
    );
  }

  const handleClick = () => {
    if (isEditing) return;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = undefined;
      return;
    }
    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = undefined;
      onClick?.(id);
    }, DOUBLE_CLICK_THRESHOLD_MS);
  };

  return (
    <div
      className="group flex items-center gap-4 px-2 py-[6px] rounded cursor-pointer hover:bg-element-primary-active"
      onClick={handleClick}
      data-testid={`project-row-${id}`}
    >
      <div className="shrink-0 w-[57px] h-[32px] rounded overflow-hidden">
        <ProjectPreviewImage src={imageUrl} alt={name} />
      </div>

      <InlineEditableText
        value={name ?? ""}
        onSave={handleRenameProject}
        inputClassName="text-sm"
        stopPropagation
        onEditingChange={setIsEditing}
        className="flex-1 min-w-0"
      >
        <Text
          component="p"
          variant="sm"
          color="glyph-primary"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {name}
        </Text>
      </InlineEditableText>

      <button
        className="opacity-0 group-hover:opacity-100 shrink-0 text-glyph-secondary hover:text-glyph-error transition-opacity"
        onClick={(e) => onDelete(e, id)}
        aria-label={t("actions.delete_project.ariaLabel")}
        data-testid={`project-row-delete-${id}`}
      >
        <Icon iconSet="16" iconName="delete" className="text-current" />
      </button>
    </div>
  );
};
