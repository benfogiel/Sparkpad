import { Preferences } from '@capacitor/preferences';
import { Reminder } from '../data/reminders';
import { ScheduledReminder } from './notifications';

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
