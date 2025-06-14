import { Preferences } from '@capacitor/preferences';
import { Reminder, isEqual } from '../data/reminders';
import { ScheduledReminder } from './notifications';

export const setFirstName = async (firstName: string) => {
  await Preferences.set({
    key: 'firstName',
    value: firstName,
  });
};

export const getFirstName = async (): Promise<string> => {
  const { value } = await Preferences.get({ key: 'firstName' });
  return value || '';
};

export const setReminders = async (reminders: Reminder[]) => {
  await Preferences.set({
    key: 'reminders',
    value: JSON.stringify(reminders),
  });
};

export const getReminders = async (): Promise<Reminder[]> => {
  const { value } = await Preferences.get({ key: 'reminders' });
  return JSON.parse(value || '[]');
};

export const getReminderById = async (id: string): Promise<Reminder | undefined> => {
  const reminders = await getReminders();
  return reminders.find((r: Reminder) => r.id === id);
};

export const addReminder = async (reminder: Reminder) => {
  const reminders = await getReminders();
  reminders.push(reminder);
  await setReminders(reminders);
};

export const deleteReminder = async (reminder: Reminder) => {
  const reminders = await getReminders();
  const index = reminders.findIndex((r: Reminder) => isEqual(r, reminder));
  if (index !== -1) {
    reminders.splice(index, 1);
    await setReminders(reminders);
  }

  const recentReminders = await getRecentReminders();
  const recentReminderIndex = recentReminders.findIndex((r: Reminder) =>
    isEqual(r, reminder)
  );
  if (recentReminderIndex !== -1) {
    recentReminders.splice(recentReminderIndex, 1);
    await setRecentReminders(recentReminders);
  }
};

export const getCategories = async (): Promise<string[]> => {
  const reminders = await getReminders();
  const categories = [...new Set(reminders.map((r: Reminder) => r.category))];
  return categories;
};

export const setUserSelectedCategories = async (categories: string[]) => {
  await Preferences.set({
    key: 'userSelectedCategories',
    value: JSON.stringify(categories),
  });
};

export const getUserSelectedCategories = async (): Promise<string[]> => {
  const { value } = await Preferences.get({ key: 'userSelectedCategories' });
  return JSON.parse(value || '[]');
};

export const getRecentReminders = async (): Promise<Reminder[]> => {
  const { value } = await Preferences.get({ key: 'recentReminders' });
  return JSON.parse(value || '[]');
};

export const setRecentReminders = async (reminders: Reminder[]) => {
  await Preferences.set({
    key: 'recentReminders',
    value: JSON.stringify(reminders),
  });
};

export const addRecentReminder = async (reminder: Reminder) => {
  const recentReminders = await getRecentReminders();
  recentReminders.push(reminder);
  if (
    recentReminders.length > parseInt(import.meta.env.VITE_MAX_RECENT_REMINDERS || '10')
  ) {
    recentReminders.shift();
  }
  await setRecentReminders(recentReminders);
};

export const firstReminderSent = async (): Promise<boolean> => {
  const { value } = await Preferences.get({ key: 'firstReminderSent' });
  return value === 'true';
};

export const setFirstReminderSent = async (sent: boolean) => {
  await Preferences.set({ key: 'firstReminderSent', value: sent.toString() });
};

export const setScheduledReminders = async (reminders: ScheduledReminder[]) => {
  await Preferences.set({
    key: 'scheduledReminders',
    value: JSON.stringify(reminders),
  });
};

export const getScheduledReminders = async (): Promise<ScheduledReminder[]> => {
  const { value } = await Preferences.get({ key: 'scheduledReminders' });
  const scheduledRemindersJson = JSON.parse(value || '[]');
  const scheduledReminders = scheduledRemindersJson.map((r: ScheduledReminder) => ({
    ...r,
    date: new Date(r.date),
  }));
  return scheduledReminders;
};
