const ONES_PLACE_DIVISOR = 10;
const TENS_PLACE_DIVISOR = 100;
const FIRST_DIGIT = 1;
const SECOND_DIGIT = 2;
const THIRD_DIGIT = 3;
const ELEVENTH_NUMBER = 11;
const TWELFTH_NUMBER = 12;
const THIRTEENTH_NUMBER = 13;

export const getInQueueStatusText = (positionInQueue: number | undefined) => {
  if (!positionInQueue) return "";

  const getOrdinalSuffix = (num: number): string => {
    const j = num % ONES_PLACE_DIVISOR;
    const k = num % TENS_PLACE_DIVISOR;
    if (j === FIRST_DIGIT && k !== ELEVENTH_NUMBER) return "st";
    if (j === SECOND_DIGIT && k !== TWELFTH_NUMBER) return "nd";
    if (j === THIRD_DIGIT && k !== THIRTEENTH_NUMBER) return "rd";
    return "th";
  };

  const position = positionInQueue + 1;

  return `In Queue: ${position}${getOrdinalSuffix(position)}`;
};
