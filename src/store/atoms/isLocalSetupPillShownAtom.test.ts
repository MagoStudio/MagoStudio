import { createStore } from "jotai";
import { describe, expect, it } from "vitest";

import { isLocalSetupPillShownAtom } from "./isLocalSetupPillShownAtom";
import { localSetupWizardCollapsedAtom } from "./localSetupWizardCollapsedAtom";
import { localSetupWizardOpenAtom } from "./localSetupWizardOpenAtom";

describe("local setup pill visibility", () => {
  it("shows the pill only while setup is open and collapsed", () => {
    const store = createStore();
    expect(store.get(isLocalSetupPillShownAtom)).toBe(false);

    store.set(localSetupWizardCollapsedAtom, true);
    expect(store.get(isLocalSetupPillShownAtom)).toBe(false);

    store.set(localSetupWizardOpenAtom, true);
    expect(store.get(isLocalSetupPillShownAtom)).toBe(true);

    store.set(localSetupWizardCollapsedAtom, false);
    expect(store.get(isLocalSetupPillShownAtom)).toBe(false);
  });
});
