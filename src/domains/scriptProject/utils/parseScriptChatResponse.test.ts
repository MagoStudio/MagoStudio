import { describe, expect, it } from "vitest";

import { parseScriptChatResponse } from "./parseScriptChatResponse";

describe("parseScriptChatResponse", () => {
  it("reads a screenplay the Agent wrote", () => {
    const outcome = parseScriptChatResponse({
      function_call: {
        name: "write_script",
        args: {
          screenplay_scenes: [
            {
              scene_number: 1,
              heading: "  INT. KITCHEN - NIGHT ",
              elements: [{ type: "action", text: "Maya slams the fridge." }]
            }
          ]
        }
      }
    });

    expect(outcome).toEqual({
      kind: "script",
      document: {
        scenes: [],
        screenplay_scenes: [
          {
            scene_number: 1,
            heading: "INT. KITCHEN - NIGHT",
            elements: [{ type: "action", text: "Maya slams the fridge." }]
          }
        ],
        hashtags: []
      }
    });
  });

  it("drops blank screenplay elements and fully blank screenplay scenes", () => {
    const outcome = parseScriptChatResponse({
      function_call: {
        name: "write_script",
        args: {
          screenplay_scenes: [
            {
              scene_number: 1,
              heading: "EXT. ROOF - DAY",
              elements: [
                { type: "action", text: "  " },
                { type: "action", text: "Wind." }
              ]
            },
            {
              scene_number: 2,
              heading: " ",
              elements: [{ type: "action", text: "" }]
            }
          ]
        }
      }
    });

    expect(
      outcome.kind === "script" && outcome.document.screenplay_scenes
    ).toEqual([
      {
        scene_number: 1,
        heading: "EXT. ROOF - DAY",
        elements: [{ type: "action", text: "Wind." }]
      }
    ]);
  });

  it("reports a write_script call whose screenplay scenes are all blank", () => {
    expect(
      parseScriptChatResponse({
        function_call: {
          name: "write_script",
          args: {
            screenplay_scenes: [{ scene_number: 1, heading: "", elements: [] }]
          }
        }
      })
    ).toEqual({ kind: "emptyResponse" });
  });

  it("still reads a legacy script written before screenplay scenes existed", () => {
    const outcome = parseScriptChatResponse({
      function_call: {
        name: "write_script",
        args: { scenes: [{ scene_number: 1, prompt: "  A quiet street.  " }] }
      }
    });

    expect(outcome).toEqual({
      kind: "script",
      document: {
        scenes: [
          {
            scene_number: 1,
            prompt: "A quiet street.",
            reference_tags: []
          }
        ],
        screenplay_scenes: [],
        hashtags: []
      }
    });
  });

  it("keeps a question out of the script", () => {
    expect(
      parseScriptChatResponse({
        function_call: {
          name: "reply",
          args: { message: "Which object did you mean?" }
        }
      })
    ).toEqual({ kind: "reply", message: "Which object did you mean?" });
  });

  it("prefers the script when the row carries both", () => {
    const outcome = parseScriptChatResponse({
      function_call: { name: "reply", args: { message: "Here you go." } },
      function_calls: [
        {
          name: "write_script",
          args: { scenes: [{ scene_number: 1, prompt: "Scene one." }] }
        }
      ]
    });

    expect(outcome.kind).toBe("script");
  });

  it("reads a script carried in function_calls when function_call is absent", () => {
    const outcome = parseScriptChatResponse({
      function_calls: [
        {
          name: "write_script",
          args: { scenes: [{ scene_number: 1, prompt: "Scene one." }] }
        }
      ]
    });

    expect(outcome.kind).toBe("script");
  });

  it("reports an answer with nothing in it", () => {
    expect(parseScriptChatResponse(undefined)).toEqual({
      kind: "emptyResponse"
    });
    expect(parseScriptChatResponse({})).toEqual({ kind: "emptyResponse" });
  });

  it("reports a write_script call whose scenes are all blank", () => {
    expect(
      parseScriptChatResponse({
        function_call: {
          name: "write_script",
          args: { scenes: [{ scene_number: 1, prompt: "   " }] }
        }
      })
    ).toEqual({ kind: "emptyResponse" });
  });

  it("reports a write_script call whose args do not parse as a document", () => {
    expect(
      parseScriptChatResponse({
        function_call: { name: "write_script", args: { scenes: "not a list" } }
      })
    ).toEqual({ kind: "emptyResponse" });
  });

  it("drops a blank scene while keeping the others", () => {
    const outcome = parseScriptChatResponse({
      function_call: {
        name: "write_script",
        args: {
          scenes: [
            { scene_number: 1, prompt: "Scene one." },
            { scene_number: 2, prompt: "   " }
          ]
        }
      }
    });

    expect(outcome.kind).toBe("script");
    expect(outcome.kind === "script" && outcome.document.scenes).toHaveLength(
      1
    );
  });
});
