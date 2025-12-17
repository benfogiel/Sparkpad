import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { updateLastNotificationDate } from './firebaseDB';
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

// if reminderDate is null, send reminder immediately
export const notifyFirstReminder = async (): Promise<ScheduledReminder | null> => {
  const reminder = await getRandomReminder();
  if (!reminder) {
    console.warn('No reminders available');
    return null;
  }

  const notificationId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  const notificationDate = new Date(Date.now() + 100);
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Sparkpad',
        body: reminder.quote,
        id: notificationId,
        schedule: {
          at: notificationDate,
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

  // update last notification date
  await updateLastNotificationDate(notificationDate);

  return { notificationId, reminder, date: notificationDate };
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
