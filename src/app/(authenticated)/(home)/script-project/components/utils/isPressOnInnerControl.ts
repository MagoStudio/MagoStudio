export const isPressOnInnerControl = (target: EventTarget | null) =>
  target instanceof Element &&
  !!target.closest("button, a, input, [role=slider]");
