const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_TZ_OFFSET = new Date().getTimezoneOffset() * 60 * 1000;

export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

/**
 * Get the day since epoch for a given date
 */
export const dateToDay = (date: Date): number => {
  return Math.floor(date.getTime() / MS_PER_DAY);
};

/**
 * Get the date from a day since epoch
 */
export const dayToDate = (day: number): Date => {
  return new Date(day * MS_PER_DAY + MS_TZ_OFFSET);
};
