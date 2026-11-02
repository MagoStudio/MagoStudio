import { afterEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { patchProjectShot } from "./patchProjectShot";

describe("patchProjectShot capabilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "mago");
  });

  it("keeps camera, dialogue and sequential fields for a local project", async () => {
    const update = vi.fn().mockResolvedValue({
      timeline_id: "timeline-1",
      edited: true
    });
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "local" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "local",
            type: "script_to_shots"
          })
        },
        scriptProjects: { update }
      }
    });

    await patchProjectShot({
      projectId: "project-1",
      timelineId: "timeline-1",
      camera: { framing: "Close-up", movement: null, lens: null },
      dialogue: [{ speaker: "VO", line: "It begins.", speaker_token: null }],
      sequential: { enabled: true, mode: "last_frame" }
    });

    expect(update).toHaveBeenCalledWith({
      projectId: "project-1",
      operation: "edit-shot",
      payload: {
        timelineId: "timeline-1",
        camera: { framing: "Close-up", movement: null, lens: null },
        dialogue: [{ speaker: "VO", line: "It begins.", speaker_token: null }],
        sequential: { enabled: true, mode: "last_frame" }
      }
    });
  });

  it("sends sequential but not camera fields to Mago Cloud", async () => {
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "cloud" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "cloud",
            type: "script_to_shots"
          })
        }
      }
    });
    const patch = vi.spyOn(backendApiClient, "patch").mockResolvedValue({
      data: {
        timeline_id: "timeline-1",
        locked: true,
        video_prompt: null,
        tags: null,
        duration_s: null,
        sequential: null,
        edited: null
      }
    });

    const editedShot = await patchProjectShot({
      projectId: "project-1",
      timelineId: "timeline-1",
      videoPrompt: "Walk into frame",
      dialogue: [{ speaker: "VO", line: "Keep walking." }],
      isShotLocked: true,
      camera: { framing: "Close-up", movement: null, lens: null },
      sequential: { enabled: true, mode: "last_frame" }
    });

    expect(patch).toHaveBeenCalledWith("/projects/project-1/shots/timeline-1", {
      video_prompt: "Walk into frame",
      dialogue: [{ speaker: "VO", line: "Keep walking." }],
      sequential: { enabled: true, mode: "last_frame" },
      locked: true
    });
    expect(editedShot).toMatchObject({
      timeline_id: "timeline-1",
      locked: true,
      tags: null,
      edited: null
    });
  });

  it("sends a sequential-only edit to Mago Cloud with its sequential field", async () => {
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "cloud" },
        projects: {
          get: vi.fn().mockResolvedValue({ id: "project-1", origin: "cloud" })
        }
      }
    });
    const patch = vi.spyOn(backendApiClient, "patch").mockResolvedValue({
      data: { timeline_id: "timeline-1", sequential: null, edited: true }
    });

    await patchProjectShot({
      projectId: "project-1",
      timelineId: "timeline-1",
      sequential: null
    });

    expect(patch).toHaveBeenCalledWith("/projects/project-1/shots/timeline-1", {
      sequential: null
    });
  });

  it("refuses a cloud edit that carries no field Mago Cloud accepts", async () => {
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "cloud" },
        projects: {
          get: vi.fn().mockResolvedValue({ id: "project-1", origin: "cloud" })
        }
      }
    });
    const patch = vi.spyOn(backendApiClient, "patch");

    await expect(
      patchProjectShot({
        projectId: "project-1",
        timelineId: "timeline-1",
        camera: { framing: "Close-up", movement: null, lens: null }
      })
    ).rejects.toThrow("not supported on Mago Cloud");
    expect(patch).not.toHaveBeenCalled();
  });

  it("passes lock state to the local project service", async () => {
    const update = vi.fn().mockResolvedValue({
      timeline_id: "timeline-1",
      locked: true,
      edited: true
    });
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "local" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "local",
            type: "script_to_shots"
          })
        },
        scriptProjects: { update }
      }
    });

    await patchProjectShot({
      projectId: "project-1",
      timelineId: "timeline-1",
      isShotLocked: true
    });

    expect(update).toHaveBeenCalledWith({
      projectId: "project-1",
      operation: "edit-shot",
      payload: { timelineId: "timeline-1", locked: true }
    });
  });

  it("sends a rename, hide or move on its own to Mago Cloud", async () => {
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "cloud" },
        projects: {
          get: vi.fn().mockResolvedValue({ id: "project-1", origin: "cloud" })
        }
      }
    });
    const patch = vi.spyOn(backendApiClient, "patch").mockResolvedValue({
      data: { timeline_id: "timeline-1", edited: false }
    });

    await patchProjectShot({
      projectId: "project-1",
      timelineId: "timeline-1",
      heading: "2 Kitchen"
    });
    await patchProjectShot({
      projectId: "project-1",
      timelineId: "timeline-1",
      isShotHidden: true
    });
    await patchProjectShot({
      projectId: "project-1",
      timelineId: "timeline-1",
      shotIndex: 0
    });

    expect(patch.mock.calls.map(([, body]) => body)).toEqual([
      { heading: "2 Kitchen" },
      { hidden: true },
      { shot_index: 0 }
    ]);
  });

  it("passes rename, hide and move to the local project service", async () => {
    const update = vi.fn().mockResolvedValue({ timeline_id: "timeline-1" });
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "local" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "local",
            type: "script_to_shots"
          })
        },
        scriptProjects: { update }
      }
    });

    await patchProjectShot({
      projectId: "project-1",
      timelineId: "timeline-1",
      heading: "2 Kitchen",
      isShotHidden: false,
      shotIndex: 3
    });

    expect(update).toHaveBeenCalledWith({
      projectId: "project-1",
      operation: "edit-shot",
      payload: {
        timelineId: "timeline-1",
        heading: "2 Kitchen",
        hidden: false,
        shot_index: 3
      }
    });
  });
});
