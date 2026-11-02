import { afterEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { postProjectShot } from "./postProjectShot";

const addShotRequest = {
  projectId: "project-1",
  shotIndex: 2,
  heading: "New kitchen",
  videoPrompt: "Maya opens the fridge.",
  dialogue: [],
  tags: { characters: ["maya"], environments: [], props: [] }
};

const addShotBody = {
  shot_index: 2,
  heading: "New kitchen",
  video_prompt: "Maya opens the fridge.",
  dialogue: [],
  tags: { characters: ["maya"], environments: [], props: [] }
};

const installDesktop = (origin: "local" | "cloud", update = vi.fn()) =>
  Object.defineProperty(window, "mago", {
    configurable: true,
    value: {
      account: { mode: origin },
      projects: {
        get: vi.fn().mockResolvedValue({ id: "project-1", origin })
      },
      scriptProjects: { update }
    }
  });

describe("postProjectShot", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "mago");
  });

  it("adds a Shot to a local project through the desktop, not the cloud", async () => {
    const update = vi.fn().mockResolvedValue({});
    installDesktop("local", update);
    const post = vi.spyOn(backendApiClient, "post");

    await postProjectShot(addShotRequest);

    expect(update).toHaveBeenCalledWith({
      projectId: "project-1",
      operation: "add-shot",
      payload: addShotBody
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("posts a cloud project's Shot to Mago Cloud", async () => {
    installDesktop("cloud");
    const post = vi
      .spyOn(backendApiClient, "post")
      .mockResolvedValue({ data: {} });

    await postProjectShot({ ...addShotRequest, heading: null });

    const { heading: _heading, ...bodyWithoutHeading } = addShotBody;
    expect(post).toHaveBeenCalledWith(
      "/projects/project-1/shots",
      bodyWithoutHeading
    );
  });
});
