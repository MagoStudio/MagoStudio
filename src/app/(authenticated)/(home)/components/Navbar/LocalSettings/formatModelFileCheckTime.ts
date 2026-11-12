export const formatModelFileCheckTime = (checkedAt: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(checkedAt));
