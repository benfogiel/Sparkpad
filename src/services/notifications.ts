import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { getRecentReminders } from './firebaseDB';
import { Reminder } from '../data/reminders';
import { getReminders, getSelectedCategories } from './firebaseDB';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface ScheduledReminder {
  notificationId: number;
  reminder: Reminder;
  date: Date;
}

export const requestNotificationPermissions = async () => {
  try {
    const result = await FirebaseMessaging.requestPermissions();
    if (result.receive !== 'granted') {
      console.warn('Firebase notification permissions denied');
      return false;
    }
    const { display } = await LocalNotifications.requestPermissions();
    if (display !== 'granted') {
      console.warn('Local notification permissions denied');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const cancelAllScheduledNotifications = async () => {
  const pendingNotifications = await LocalNotifications.getPending();
  if (pendingNotifications.notifications.length > 0) {
    await LocalNotifications.cancel(pendingNotifications);
  }
};

// if reminderDate is null, send reminder immediately
export const scheduleReminder = async (
  reminderDate: Date | null = null
): Promise<ScheduledReminder | null> => {
  // don't schedule a reminder if it's already scheduled
  const pendingNotifications = await LocalNotifications.getPending();
  const pendingReminderIds = pendingNotifications.notifications.map(
    (n) => n.extra?.reminderId
  );
  // don't schedule a reminder if it's a recently sent reminder
  const recentReminders = await getRecentReminders();
  const recentReminderIds = recentReminders.map((r) => r.id);

  const excludeIds = pendingReminderIds.concat(recentReminderIds);
  const reminder = await getRandomReminder(excludeIds);
  if (!reminder) {
    console.warn('No reminders available');
    return null;
  }

  const notificationId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Reemind',
        body: reminder.quote,
        id: notificationId,
        schedule: {
          at: reminderDate || new Date(Date.now() + 100),
          repeats: false,
        },
        sound: undefined,
        attachments: undefined,
        actionTypeId: '',
        extra: {
          reminderId: reminder.id,
        },
      },
    ],
  });

  return { notificationId, reminder, date: reminderDate };
};

// Select random reminder
const getRandomReminder = async (excludeIds: string[] = []) => {
  let reminders = await getReminders();
  const userSelectedCategories = await getSelectedCategories();
  reminders = reminders.filter(
    (reminder) =>
      userSelectedCategories.includes(reminder.category) &&
      !excludeIds.includes(reminder.id)
  );
  if (reminders.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * reminders.length);
  return reminders[randomIndex];
};
