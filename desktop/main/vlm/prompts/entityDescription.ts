export type EntityDescriptionKind = "character" | "environment" | "prop";

const FACETS: Record<EntityDescriptionKind, string> = {
  character:
    "age, build, face, hair, wardrobe and its colours, and anything distinctive they carry or wear",
  environment:
    "the kind of place, its architecture and materials, the period it belongs to, and its habitual light",
  prop: "what the object is, its size, material, colour, wear, and any distinguishing markings"
};

export const entityDescriptionPrompt = (
  value: string
): { kind: EntityDescriptionKind; prompt: string } => {
  const kind: EntityDescriptionKind =
    value === "environment" || value === "prop" ? value : "character";
  return {
    kind,
    prompt:
      `This image is a reference sheet for a ${kind} in a film. Describe the ${kind} itself, ` +
      "as it would appear in a scene — not the reference sheet. Ignore the sheet's layout " +
      "entirely: say nothing about multiple views, angles, poses, panels, turnarounds, " +
      "plain or studio backdrops, framing, or image quality. In two or three sentences " +
      `state only what is durably true of the ${kind}: ${FACETS[kind]}. Do not interpret mood, do ` +
      "not guess at story, and do not describe a momentary action. Write plain prose, no " +
      "lists, no preamble, and do not begin with 'the image' or 'this reference'."
  };
};
