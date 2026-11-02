export const scrollToShotInContainer = (
  container: HTMLElement | null,
  timelineId: string
): boolean => {
  const target = Array.from(
    container?.querySelectorAll<HTMLElement>("[data-shot-timeline-id]") ?? []
  ).find((element) => element.dataset.shotTimelineId === timelineId);
  if (!target) return false;
  target.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "center"
  });
  return true;
};
