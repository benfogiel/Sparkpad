import { Preferences } from '@capacitor/preferences';

export const firstReminderSent = async (): Promise<boolean> => {
  const { value } = await Preferences.get({ key: 'firstReminderSent' });
  return value === 'true';
};

export const setFirstReminderSent = async (sent: boolean) => {
  await Preferences.set({ key: 'firstReminderSent', value: sent.toString() });
};
