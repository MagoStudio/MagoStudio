let activeDraggedIds: string[] = [];

export const setActiveDraggedIds = (ids: string[]) => {
  activeDraggedIds = ids;
};

export const getActiveDraggedIds = (): string[] => activeDraggedIds;

export const clearActiveDraggedIds = () => {
  activeDraggedIds = [];
};
