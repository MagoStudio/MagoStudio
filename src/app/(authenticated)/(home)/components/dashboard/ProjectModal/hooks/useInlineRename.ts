import { useRef, useState } from "react";
export const useInlineRename = (
  currentName: string,
  onSave: (newName: string) => void
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  const registerInput = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (node) {
      node.focus();
      node.select();
    }
  };

  const startEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    cancelledRef.current = false;
    setEditValue(currentName);
    setIsEditing(true);
  };
  const handleSave = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== currentName) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      cancelledRef.current = true;
      setIsEditing(false);
    }
  };
  return {
    isEditing,
    editValue,
    setEditValue,
    inputRef,
    registerInput,
    startEditing,
    handleSave,
    handleKeyDown
  };
};
