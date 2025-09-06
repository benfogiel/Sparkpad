import { v4 as uuidv4 } from 'uuid';

export interface Reminder {
  id: string;
  quote: string;
  category: string;
}

const defaultReminders: { [key: string]: string[] } = {
  Motivational: [
    'The only way to do great work is to love what you do.',
    "Believe you can and you're halfway there.",
    'The future belongs to those who believe in the beauty of their dreams.',
    'Do what you can, with what you have, where you are.',
  ],
  Funny: [
    "I'm not lazy. I'm just on my energy saving mode.",
    "I'm not a hoarder. I'm just saving things for the future.",
  ],
};

export const getDefaultReminders = (): Reminder[] => {
  const reminders: Reminder[] = [];
  for (const [category, quotes] of Object.entries(defaultReminders)) {
    for (const quote of quotes) {
      // TODO: add static id to each reminder so it's consistent across calls
      reminders.push({ id: uuidv4(), quote, category });
    }
  }
  return reminders;
};

export const getDefaultCategories = (): string[] => {
  return Object.keys(defaultReminders);
};
