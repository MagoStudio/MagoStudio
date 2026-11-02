import { AgentScreenplayScene } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { formatScreenplay } from "./formatScreenplay";

const spaces = (count: number) => " ".repeat(count);

const buildScene = (
  overrides: Partial<AgentScreenplayScene> = {}
): AgentScreenplayScene => ({
  scene_number: 1,
  heading: "INT. KITCHEN - NIGHT",
  elements: [],
  ...overrides
});

describe("formatScreenplay", () => {
  it("lays out a heading, an action and a dialogue block", () => {
    const script = formatScreenplay([
      buildScene({
        elements: [
          { type: "action", text: "Maya slams the fridge." },
          {
            type: "dialogue",
            character: "Maya",
            parenthetical: "quietly",
            text: "We're close."
          }
        ]
      })
    ]);

    expect(script).toBe(
      "INT. KITCHEN - NIGHT\n\n" +
        "Maya slams the fridge.\n\n" +
        `${spaces(22)}MAYA\n` +
        `${spaces(16)}(quietly)\n` +
        `${spaces(10)}We're close.`
    );
  });

  it("upper-cases a camera line and keeps it flush left, above its action", () => {
    expect(
      formatScreenplay([
        buildScene({
          elements: [
            { type: "camera", text: " medium two-shot, slow push in. " },
            { type: "action", text: "Maya and Leo lunge at the croissant." }
          ]
        })
      ])
    ).toBe(
      "INT. KITCHEN - NIGHT\n\n" +
        "MEDIUM TWO-SHOT, SLOW PUSH IN.\n\n" +
        "Maya and Leo lunge at the croissant."
    );
  });

  it("upper-cases the heading and keeps it flush left", () => {
    expect(
      formatScreenplay([buildScene({ heading: "  ext. roof - day " })])
    ).toBe("EXT. ROOF - DAY");
  });

  it("leaves a long action on one line for the box to wrap", () => {
    const longAction =
      "Maya crosses the whole kitchen, opens every drawer one after another, and finds nothing.";

    expect(
      formatScreenplay([
        buildScene({ elements: [{ type: "action", text: longAction }] })
      ])
    ).toBe(`INT. KITCHEN - NIGHT\n\n${longAction}`);
  });

  it("wraps long dialogue inside its indented column", () => {
    const script = formatScreenplay([
      buildScene({
        elements: [
          {
            type: "dialogue",
            character: "ALEX",
            text: "If we leave now we can still make it before the bridge closes."
          }
        ]
      })
    ]);

    const dialogueLines = script.split("\n").slice(3);
    expect(dialogueLines.length).toBeGreaterThan(1);
    for (const line of dialogueLines) {
      expect(line.startsWith(spaces(10))).toBe(true);
      expect(line.slice(10).length).toBeLessThanOrEqual(35);
      expect(line[10]).not.toBe(" ");
    }
  });

  it("adds the extension to the cue and keeps a parenthetical single-wrapped", () => {
    const script = formatScreenplay([
      buildScene({
        elements: [
          {
            type: "dialogue",
            character: "narrator",
            extension: "(v.o.)",
            parenthetical: "(softly)",
            text: "It began here."
          }
        ]
      })
    ]);

    expect(script).toContain(`${spaces(22)}NARRATOR (V.O.)\n`);
    expect(script).toContain(`${spaces(16)}(softly)\n`);
  });

  it("wraps a long parenthetical at 25 columns", () => {
    const script = formatScreenplay([
      buildScene({
        elements: [
          {
            type: "dialogue",
            character: "MAYA",
            parenthetical: "barely above a whisper, eyes on the door",
            text: "Now."
          }
        ]
      })
    ]);

    const parentheticalLines = script
      .split("\n")
      .filter((line) => line.startsWith(spaces(16)) && line[16] !== " ")
      .filter((line) => !line.trim().startsWith("Now"));
    expect(parentheticalLines.length).toBeGreaterThan(1);
    for (const line of parentheticalLines) {
      expect(line.slice(16).length).toBeLessThanOrEqual(25);
    }
  });

  it("right-aligns an upper-cased transition to column 45", () => {
    const script = formatScreenplay([
      buildScene({ elements: [{ type: "transition", text: "cut to:" }] })
    ]);

    const transitionLine = script.split("\n").at(-1)!;
    expect(transitionLine).toBe(`${spaces(38)}CUT TO:`);
    expect(transitionLine.length).toBe(45);
  });

  it("separates scenes by exactly one blank line with none at the ends", () => {
    const script = formatScreenplay([
      buildScene({ elements: [{ type: "action", text: "One." }] }),
      buildScene({
        scene_number: 2,
        heading: "EXT. STREET - DAY",
        elements: [{ type: "action", text: "Two." }]
      })
    ]);

    expect(script).toBe(
      "INT. KITCHEN - NIGHT\n\nOne.\n\nEXT. STREET - DAY\n\nTwo."
    );
  });

  it("shows dialogue with no speaker as action, so its text is kept", () => {
    expect(
      formatScreenplay([
        buildScene({ elements: [{ type: "dialogue", text: "Who's there?" }] })
      ])
    ).toBe("INT. KITCHEN - NIGHT\n\nWho's there?");
  });

  it("shows an element of unknown type as action", () => {
    expect(
      formatScreenplay([
        buildScene({ elements: [{ type: "montage", text: "Days pass." }] })
      ])
    ).toBe("INT. KITCHEN - NIGHT\n\nDays pass.");
  });

  it("skips blank elements and blank scenes", () => {
    expect(
      formatScreenplay([
        buildScene({ elements: [{ type: "action", text: "   " }] }),
        buildScene({ scene_number: 2, heading: " ", elements: [] })
      ])
    ).toBe("INT. KITCHEN - NIGHT");
  });
});
