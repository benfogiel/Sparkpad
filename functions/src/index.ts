/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import {DateTime} from "luxon";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

interface Reminder {
  id: string;
  quote: string;
  category: string;
}

interface RecentReminder {
  reminder: Reminder;
  remindedAt: Timestamp;
}

/**
 * Generate a random DateTime between timeLower and timeUpper on the given day.
 */
function generateRandomTimeForDay(
  day: DateTime,
  timeLower: string,
  timeUpper: string
): DateTime {
  const [lowerH, lowerM] = timeLower.split(":").map(Number);
  const [upperH, upperM] = timeUpper.split(":").map(Number);
  const lowerTotal = lowerH * 60 + lowerM;
  const upperTotal = upperH * 60 + upperM;
  const randomMinutes =
    Math.floor(Math.random() * (upperTotal - lowerTotal + 1)) + lowerTotal;

  return day.startOf("day").plus({
    hours: Math.floor(randomMinutes / 60),
    minutes: randomMinutes % 60,
  });
}

async function getRecentReminders(userId: string): Promise<RecentReminder[]> {
  const snapshot = await db
    .collection(`users/${userId}/recentReminders`).get();
  return snapshot.empty ?
    [] :
    snapshot.docs.map((doc) => doc.data() as RecentReminder);
}

async function addRecentReminder(userId: string, recentReminder: RecentReminder) {
  const recentReminders = await getRecentReminders(userId);
  const duplicate = recentReminders.find(
    (r) => r.reminder.id === recentReminder.reminder.id
  );
  if (duplicate) {
    await db
      .collection(`users/${userId}/recentReminders`)
      .doc(duplicate.reminder.id).delete();
  }
  await db
    .collection(`users/${userId}/recentReminders`)
    .doc(recentReminder.reminder.id).set(recentReminder);
}

async function getRandomReminder(
  userId: string, selectedCategories: string[]
): Promise<Reminder | null> {
  const snapshot = await db.collection(`users/${userId}/reminders`).get();
  if (snapshot.empty) return null;

  let reminders = snapshot.docs.map((doc) => doc.data() as Reminder);

  // Filter to only reminders in the user's selected categories
  if (selectedCategories.length > 0) {
    const filtered = reminders.filter((r) => selectedCategories.includes(r.category));
    if (filtered.length > 0) {
      reminders = filtered;
    }
  }

  // Prefer non-recent reminders
  const recentReminders = await getRecentReminders(userId);
  const nonRecent = reminders.filter(
    (r) => !recentReminders.some((rr) => rr.reminder.id === r.id)
  );
  if (nonRecent.length > 0) {
    reminders = nonRecent;
  }

  return reminders[Math.floor(Math.random() * reminders.length)];
}

export const scheduleDailyReminder = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "UTC",
  },
  async (_event) => {
    try {
      const now = DateTime.utc();
      const usersSnapshot = await db.collection("users").get();
      const notificationPromises: Promise<void>[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const userRef = db.collection("users").doc(userId);

        const userTimezone = userData.timezone || "UTC";
        const userNow = now.setZone(userTimezone);
        const todayStart = userNow.startOf("day");

        // 1. Skip if already notified today
        const lastNotification = userData.lastNotificationDate?.toDate();
        if (lastNotification && lastNotification >= todayStart.toJSDate()) {
          continue;
        }

        const timeLower = userData.timeLower || "09:00";
        const timeUpper = userData.timeUpper || "21:00";

        // 2. Ensure a scheduled time exists for today
        let scheduledTime: DateTime | null = null;
        const storedScheduled = userData.scheduledReminderTime?.toDate();

        if (storedScheduled) {
          const storedDT = DateTime.fromJSDate(storedScheduled).setZone(userTimezone);
          // Check if the stored time is for today
          if (storedDT >= todayStart && storedDT < todayStart.plus({days: 1})) {
            scheduledTime = storedDT;
          }
        }

        if (!scheduledTime) {
          // Generate and persist a random time for today
          scheduledTime = generateRandomTimeForDay(userNow, timeLower, timeUpper);
          await userRef.update({
            scheduledReminderTime: Timestamp.fromDate(scheduledTime.toJSDate()),
          });
        }

        // 3. Skip if it's not time yet
        if (userNow < scheduledTime) {
          continue;
        }

        // 4. Send notification — fetch a fresh reminder at send time
        const fcmToken = userData.fcmToken;
        if (!fcmToken) {
          console.log(`No FCM token found for user ${userId}`);
          continue;
        }

        const selectedCategories: string[] = userData.selectedCategories || [];
        const randomReminder = await getRandomReminder(userId, selectedCategories);
        if (!randomReminder) {
          console.log(`No reminder found for user ${userId}`);
          continue;
        }

        const message: admin.messaging.Message = {
          token: fcmToken,
          notification: {
            title: "Daily Reminder",
            body: randomReminder.quote,
          },
          data: {
            reminderId: randomReminder.id,
            timestamp: Timestamp.now().toMillis().toString(),
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
        };

        const notificationDate = Timestamp.fromDate(todayStart.toJSDate());
        notificationPromises.push(
          messaging
            .send(message)
            .then(async () => {
              console.log(`Notification sent to user ${userId}`);
              await userRef.update({lastNotificationDate: notificationDate});
              await addRecentReminder(userId, {
                reminder: randomReminder,
                remindedAt: notificationDate,
              });
            })
            .catch((error) => {
              console.error(`Error sending notification to user ${userId}:`, error);
            })
        );
      }

      await Promise.all(notificationPromises);
      console.log("Daily reminders processed successfully");
    } catch (error) {
      console.error("Error processing daily reminders:", error);
    }
  }
);
