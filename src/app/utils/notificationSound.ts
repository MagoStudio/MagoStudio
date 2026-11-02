const DECEMBER_MONTH_INDEX = 11;

const DEFAULT_SOUND_PATH = "/notification.wav";
const CHRISTMAS_SOUND_PATH = "/xmas-notification.wav";

export const getNotificationSoundPath = (): string => {
  const currentMonth = new Date().getMonth();

  if (currentMonth === DECEMBER_MONTH_INDEX) {
    return CHRISTMAS_SOUND_PATH;
  }

  return DEFAULT_SOUND_PATH;
};
