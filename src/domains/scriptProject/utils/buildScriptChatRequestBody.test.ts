import { describe, expect, it } from "vitest";

import { buildScriptChatRequestBody } from "./buildScriptChatRequestBody";

const A_SCRIPT = "Shot 1:\nScene one.\n\nShot 2:\nScene two.";

describe("buildScriptChatRequestBody", () => {
  it("carries the project id and the user's message", () => {
    const body = buildScriptChatRequestBody({
      projectId: "project-1",
      userInput: "A lighthouse at dawn"
    });

    expect(body.project_id).toBe("project-1");
    expect(body.message).toBe("A lighthouse at dawn");
  });

  it("offers the Agent one function for scripts and one for talking", () => {
    const body = buildScriptChatRequestBody({
      projectId: "project-1",
      userInput: "x"
    });
    const declaredNames = (
      body.tools[0]!.function_declarations as { name: string }[]
    ).map((declaration) => declaration.name);

    expect(declaredNames).toEqual(["write_script", "reply"]);
  });

  it("declares write_script's screenplay scenes as an ordered list of typed elements", () => {
    const body = buildScriptChatRequestBody({
      projectId: "project-1",
      userInput: "x"
    });
    const writeScript = (
      body.tools[0]!.function_declarations as {
        name: string;
        parameters: {
          properties: {
            screenplay_scenes: {
              type: string;
              items: {
                type: string;
                properties: {
                  elements: {
                    type: string;
                    items: { properties: { type: { enum: string[] } } };
                  };
                };
              };
            };
          };
          required: string[];
        };
      }[]
    ).find((declaration) => declaration.name === "write_script")!;
    const screenplayScenes =
      writeScript.parameters.properties.screenplay_scenes;

    expect(screenplayScenes.type).toBe("array");
    expect(screenplayScenes.items.type).toBe("object");
    expect(screenplayScenes.items.properties.elements.type).toBe("array");
    expect(
      screenplayScenes.items.properties.elements.items.properties.type.enum
    ).toEqual(["camera", "action", "dialogue", "transition"]);
    expect(writeScript.parameters.required).toEqual(["screenplay_scenes"]);
  });

  it("embeds the current script inside the message, ahead of the user's own text, when given", () => {
    const body = buildScriptChatRequestBody({
      projectId: "project-1",
      userInput: "Make shot 2 darker",
      currentScript: A_SCRIPT
    });

    expect(body.message).toContain(A_SCRIPT);
    expect(body.message.endsWith("Make shot 2 darker")).toBe(true);
    expect(body.message).not.toBe("Make shot 2 darker");
  });

  it("sends only the user's text when there is no current script", () => {
    const body = buildScriptChatRequestBody({
      projectId: "project-1",
      userInput: "A lighthouse at dawn"
    });

    expect(body.message).toBe("A lighthouse at dawn");
  });

  it("sends only the user's text when the current script is blank", () => {
    const body = buildScriptChatRequestBody({
      projectId: "project-1",
      userInput: "A lighthouse at dawn",
      currentScript: "   "
    });

    expect(body.message).toBe("A lighthouse at dawn");
  });

  it("carries a system prompt on every request", () => {
    const body = buildScriptChatRequestBody({
      projectId: "project-1",
      userInput: "Anything"
    });

    expect(body.system_prompt.length).toBeGreaterThan(0);
  });
});
