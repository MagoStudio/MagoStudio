// @vitest-environment node
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ComfyClient, COMFY_LOST_PROMPT_MESSAGE } from "./ComfyClient";
import { COMFY_PROCESS_CLIENT_ID } from "./comfyClientId";

const endpoint = "http://127.0.0.1:8188";

const createMonitor = () => ({
  watch: vi.fn(),
  forget: vi.fn(),
  livePrompt: vi.fn(() => null),
  waitForSettle: vi.fn(() => Promise.resolve()),
  resetConnection: vi.fn()
});

const stubFetch = (
  respond: (url: string, init?: RequestInit) => Response | Promise<Response>
) => {
  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) =>
    respond(String(input), init)
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("ComfyClient", () => {
  let temporaryDirectory: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "comfy-client-"));
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("queues a graph under the process client id and watches the prompt", async () => {
    const monitor = createMonitor();
    const fetchMock = stubFetch(() => Response.json({ prompt_id: "p1" }));
    const graph = { "1": { class_type: "KSampler", inputs: { steps: 4 } } };

    await expect(
      new ComfyClient(endpoint, monitor).submitGraph(graph)
    ).resolves.toBe("p1");

    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as {
      client_id: string;
    };
    expect(body.client_id).toBe(COMFY_PROCESS_CLIENT_ID);
    expect(monitor.watch).toHaveBeenCalledWith("p1", graph);
  });

  it("names uploads by content so different files never collide", async () => {
    const uploadedNames: string[] = [];
    stubFetch(async (_url, init) => {
      const form = init?.body as FormData;
      const file = form.get("image") as File;
      uploadedNames.push(file.name);
      return Response.json({
        name: file.name,
        subfolder: form.get("subfolder")
      });
    });
    const firstVideo = path.join(temporaryDirectory, "a.mp4");
    const secondVideo = path.join(temporaryDirectory, "b.mp4");
    const copyOfFirstVideo = path.join(temporaryDirectory, "c.mp4");
    await writeFile(firstVideo, "first");
    await writeFile(secondVideo, "second");
    await writeFile(copyOfFirstVideo, "first");
    const client = new ComfyClient(endpoint, createMonitor());

    const references = [
      await client.uploadFile(firstVideo),
      await client.uploadFile(secondVideo),
      await client.uploadFile(copyOfFirstVideo)
    ];

    expect(references[0]).toMatch(/^mago\/[0-9a-f]{32}\.mp4$/);
    expect(references[0]).not.toBe(references[1]);
    expect(references[2]).toBe(references[0]);
  });

  it("reports a prompt that is in neither history nor queue as lost", async () => {
    stubFetch((url) =>
      url.endsWith("/queue")
        ? Response.json({ queue_running: [], queue_pending: [] })
        : Response.json({})
    );

    await expect(
      new ComfyClient(endpoint, createMonitor()).readPromptStatus("lost")
    ).resolves.toEqual({ state: "error", message: COMFY_LOST_PROMPT_MESSAGE });
  });

  it("reads a finished prompt's outputs from history and stops watching it", async () => {
    stubFetch(() =>
      Response.json({
        p1: {
          status: { status_str: "success", completed: true },
          outputs: { "9": { images: [{ filename: "out.png" }] } }
        }
      })
    );

    const monitor = createMonitor();

    await expect(
      new ComfyClient(endpoint, monitor).readPromptStatus("p1")
    ).resolves.toEqual({
      state: "finished",
      outputs: { "9": { images: [{ filename: "out.png" }] } }
    });
    expect(monitor.forget).toHaveBeenCalledWith("p1");
  });

  it("deletes a pending prompt and interrupts only a running one", async () => {
    const monitor = createMonitor();
    const pendingFetch = stubFetch((url) =>
      url.endsWith("/queue")
        ? Response.json({ queue_pending: [[0, "p1"]], queue_running: [] })
        : Response.json({})
    );
    await new ComfyClient(endpoint, monitor).cancel("p1");
    expect(pendingFetch).toHaveBeenLastCalledWith(
      `${endpoint}/queue`,
      expect.objectContaining({ body: JSON.stringify({ delete: ["p1"] }) })
    );

    const runningFetch = stubFetch((url) =>
      url.endsWith("/queue")
        ? Response.json({ queue_pending: [], queue_running: [[0, "p2"]] })
        : Response.json({})
    );
    await new ComfyClient(endpoint, monitor).cancel("p2");
    expect(runningFetch).toHaveBeenLastCalledWith(
      `${endpoint}/interrupt`,
      expect.objectContaining({ body: JSON.stringify({ prompt_id: "p2" }) })
    );

    const otherPromptFetch = stubFetch(() =>
      Response.json({ queue_pending: [], queue_running: [[0, "someone-else"]] })
    );
    await new ComfyClient(endpoint, monitor).cancel("p3");
    expect(otherPromptFetch).toHaveBeenCalledTimes(1);
    expect(monitor.forget).toHaveBeenCalledWith("p3");
  });

  it("never interrupts when only removing a pending prompt", async () => {
    const fetchMock = stubFetch(() =>
      Response.json({ queue_pending: [], queue_running: [[0, "p1"]] })
    );

    await new ComfyClient(endpoint, createMonitor()).removeFromQueueIfPending(
      "p1"
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("streams a download to disk", async () => {
    stubFetch(() => new Response("video-bytes"));
    const destination = path.join(temporaryDirectory, "out.mp4");

    await new ComfyClient(endpoint, createMonitor()).downloadToFile(
      { filename: "out.mp4" },
      destination,
      { maxBytes: 1024, defaultType: "output" }
    );

    await expect(readFile(destination, "utf8")).resolves.toBe("video-bytes");
  });

  it("stops a streamed download past the size cap and removes the partial file", async () => {
    stubFetch(
      () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(600));
              controller.enqueue(new Uint8Array(600));
              controller.close();
            }
          })
        )
    );
    const destination = path.join(temporaryDirectory, "big.mp4");

    await expect(
      new ComfyClient(endpoint, createMonitor()).downloadToFile(
        { filename: "big.mp4" },
        destination,
        { maxBytes: 1000, defaultType: "output" }
      )
    ).rejects.toThrow("too large");
    expect(existsSync(destination)).toBe(false);
  });

  it("returns cancelled without polling when the caller cancels", async () => {
    const fetchMock = stubFetch(() => Response.json({}));

    await expect(
      new ComfyClient(endpoint, createMonitor()).waitForPrompt("p1", {
        timeoutMs: 1000,
        pollIntervalMs: 1,
        isCancelled: () => true
      })
    ).resolves.toEqual({ kind: "cancelled" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("waits until history reports the prompt finished", async () => {
    let historyReads = 0;
    stubFetch((url) => {
      if (url.endsWith("/queue"))
        return Response.json({ queue_running: [[0, "p1"]], queue_pending: [] });
      historyReads += 1;
      return Response.json(
        historyReads < 3
          ? {}
          : {
              p1: {
                status: { completed: true },
                outputs: { "2": { text: ["done"] } }
              }
            }
      );
    });

    await expect(
      new ComfyClient(endpoint, createMonitor()).waitForPrompt("p1", {
        timeoutMs: 5000,
        pollIntervalMs: 1
      })
    ).resolves.toEqual({
      kind: "finished",
      outputs: { "2": { text: ["done"] } }
    });
  });
});
