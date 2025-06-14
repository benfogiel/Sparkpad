import { LocalNotifications } from '@capacitor/local-notifications';
import {
  getReminders,
  getUserSelectedCategories,
  getRecentReminders,
  setScheduledReminders,
  getScheduledReminders,
  addRecentReminder,
} from './preferences';
import { Reminder } from '../data/reminders';
import { addDays, dateToDay, dayToDate } from '../util';

export interface ScheduledReminder {
  notificationId: number;
  reminder: Reminder;
  date: Date;
}

export const requestNotificationPermissions = async () => {
  const { display } = await LocalNotifications.requestPermissions();
  if (display !== 'granted') {
    console.warn('Notification permissions denied');
    return false;
  }
  return true;
};

export const rescheduleReminders = async (quantity: number = 30) => {
  const now = new Date();
  let startDate = new Date();

  // Get previously scheduled reminders that have already been sent
  // and add to the recent reminders list
  const previouslyScheduledReminders = await getScheduledReminders();
  for (const scheduledReminder of previouslyScheduledReminders) {
    if (scheduledReminder.date < now) {
      addRecentReminder(scheduledReminder.reminder);
    }
    // if a reminder has already been sent today, start scheduling tomorrow
    if (
      dateToDay(scheduledReminder.date) === dateToDay(now) &&
      scheduledReminder.date < now
    ) {
      startDate = addDays(startDate, 1);
    }
  }

  // Replace all scheduled reminders with new ones
  await cancelAllScheduledNotifications();
  const scheduledReminders = [];
  let reminderDay = dateToDay(startDate);
  for (let i = 0; i < quantity; i++) {
    const reminderTime = getRandomFutureReminderTime(reminderDay);
    const scheduledReminder = await scheduleReminder(reminderTime);
    if (!scheduledReminder) break;
    scheduledReminders.push(scheduledReminder);
    reminderDay = dateToDay(reminderTime) + 1;
  }

  await setScheduledReminders(scheduledReminders);
};

export const cancelAllScheduledNotifications = async () => {
  const pendingNotifications = await LocalNotifications.getPending();
  if (pendingNotifications.notifications.length > 0) {
    await LocalNotifications.cancel(pendingNotifications);
  }
};

export const scheduleReminder = async (
  reminderDate: Date
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
          at: reminderDate,
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

/**
 * Get a random future reminder time.
 * @param startDay - The day to start the search for a random reminder time
 * @returns A random future reminder time between start and end reminder hours.
 */
const getRandomFutureReminderTime = (startDay: number): Date => {
  const now = new Date();
  const nowDay = dateToDay(now);

  let startHour = parseInt(import.meta.env.VITE_NOTIFICATION_START_HOUR || '8');
  const endHour = parseInt(import.meta.env.VITE_NOTIFICATION_END_HOUR || '17');

  if (nowDay >= startDay) {
    startDay = nowDay;
    if (now.getHours() + 1 > endHour) {
      startDay += 1;
    } else {
      startHour = now.getHours() + 1;
    }
  }

  const randomHour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
  const randomMinute = Math.floor(Math.random() * 60);
  const randomTime = dayToDate(startDay);
  randomTime.setHours(randomHour, randomMinute, 0, 0);

  return randomTime;
};

// Select random reminder
const getRandomReminder = async (excludeIds: string[] = []) => {
  let reminders = await getReminders();
  const userSelectedCategories = await getUserSelectedCategories();
  reminders = reminders.filter(
    (reminder) =>
      userSelectedCategories.includes(reminder.category) &&
      !excludeIds.includes(reminder.id)
  );
  if (reminders.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * reminders.length);
  return reminders[randomIndex];
};
