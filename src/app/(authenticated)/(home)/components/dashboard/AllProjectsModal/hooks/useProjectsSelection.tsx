import { projectsSelectionAtom } from "@store/atoms";
import { useAtom } from "jotai";

interface ProjectsSelection {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  count: number;
}

export const useProjectsSelection = (): ProjectsSelection => {
  const [selectedIds, setSelectedIds] = useAtom(projectsSelectionAtom);

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const clear = () =>
    setSelectedIds((prev) => (prev.size === 0 ? prev : new Set()));

  return {
    selectedIds,
    isSelected: (id) => selectedIds.has(id),
    toggle,
    clear,
    count: selectedIds.size
  };
};
