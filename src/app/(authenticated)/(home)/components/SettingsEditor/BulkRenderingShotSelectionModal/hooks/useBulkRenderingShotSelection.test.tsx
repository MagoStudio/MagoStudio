import { bulkRenderingFlowAtom } from "@store/atoms";
import { renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useBulkRenderingShotSelection } from "./useBulkRenderingShotSelection";

function renderSelection(allShotIds: string[], selectedShotIds: string[]) {
  const store = createStore();
  store.set(bulkRenderingFlowAtom, {
    view: "shotSelection",
    selectedShotIds: new Set(selectedShotIds)
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useBulkRenderingShotSelection(allShotIds), {
    wrapper
  }).result;
}

describe("useBulkRenderingShotSelection", () => {
  it("counts only the selected ids that are actually in allShotIds", () => {
    const result = renderSelection(
      ["shot-a", "shot-b"],
      ["shot-a", "shot-from-previous-project"]
    );

    expect(result.current.selectedShotIds.size).toBe(1);
    expect(result.current.selectedShotIds.has("shot-a")).toBe(true);
    expect(
      result.current.selectedShotIds.has("shot-from-previous-project")
    ).toBe(false);
    expect(result.current.selectedCount).toBe(1);
  });

  it("matches the raw selection size when every selected id belongs to allShotIds", () => {
    const result = renderSelection(["shot-a", "shot-b"], ["shot-a", "shot-b"]);

    expect(result.current.selectedCount).toBe(2);
  });

  it("reads zero when the whole selection is stale relative to allShotIds", () => {
    const result = renderSelection(
      ["shot-a", "shot-b"],
      ["shot-from-previous-project"]
    );

    expect(result.current.selectedCount).toBe(0);
  });

  it("areAllShotsSelected ignores stale ids left over from a previous Project", () => {
    const result = renderSelection(
      ["shot-a", "shot-b"],
      ["shot-from-previous-project"]
    );

    expect(result.current.areAllShotsSelected).toBe(false);
  });
});
