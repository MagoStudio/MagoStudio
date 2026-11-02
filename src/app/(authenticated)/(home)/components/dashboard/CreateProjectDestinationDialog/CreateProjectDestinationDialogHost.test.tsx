import "@config/i18n";
import { createProjectDestinationRequestAtom } from "@store/atoms/createProjectDestinationRequestAtom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), showErrorToast: vi.fn() }));
vi.mock("@store/useToast", () => ({
  useToast: () => ({ showErrorToast: mocks.showErrorToast })
}));
vi.mock(
  "@app/components/LocalSetupWizard/hooks/useOpenLocalSetupWizard",
  () => ({ useOpenLocalSetupWizard: () => vi.fn() })
);
vi.mock("@domains/project/useCreateNewProject", () => ({
  useCreateNewProject: () => ({ createNewProject: vi.fn() })
}));
vi.mock("@domains/scriptProject/useCreateScriptProject", () => ({
  useCreateScriptProject: () => ({
    createScriptProject: vi.fn(),
    isCreatingScriptProject: false
  })
}));
vi.mock(
  "@home/components/dashboard/ProjectModal/useNewVideoProjectModal",
  () => ({
    useNewVideoProjectModal: () => ({
      newVideoProjectModal: null,
      openNewVideoProjectModal: vi.fn()
    })
  })
);
vi.mock("./hooks/useProjectCreationReadiness", () => ({
  useProjectCreationReadiness: () => ({
    isLocalProjectCreationReady: false,
    isCloudProjectCreationReady: false
  })
}));

import { CreateProjectDestinationDialogHost } from "./CreateProjectDestinationDialogHost";

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
const openDialog = () => {
  vi.stubGlobal("mago", { account: { signOut: mocks.signOut } });
  const store = createStore();
  store.set(createProjectDestinationRequestAtom, "script_to_shots");
  render(
    <Provider store={store}>
      <CreateProjectDestinationDialogHost />
    </Provider>
  );
  return store;
};
describe("creation dialog cloud sign-in", () => {
  it("opens the Clerk entry screen directly by resetting the app mode", () => {
    mocks.signOut.mockResolvedValue(undefined);
    const store = openDialog();
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in to Mago cloud" })
    );
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(store.get(createProjectDestinationRequestAtom)).toBeNull();
  });
  it("reports a failed sign-in handoff", async () => {
    mocks.signOut.mockRejectedValue(new Error("Window rebuild failed"));
    openDialog();
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in to Mago cloud" })
    );
    await waitFor(() =>
      expect(mocks.showErrorToast).toHaveBeenCalledWith({
        message: "Unable to open sign-in. Please try again."
      })
    );
  });
});
