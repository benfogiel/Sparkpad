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
 * Generate `count` random DateTimes spread across [timeLower, timeUpper].
 * Splits the window into `count` equal chunks and picks a random minute in each.
 */
function generateRandomTimesForDay(
  day: DateTime,
  timeLower: string,
  timeUpper: string,
  count: number
): DateTime[] {
  const [lowerH, lowerM] = timeLower.split(":").map(Number);
  const [upperH, upperM] = timeUpper.split(":").map(Number);
  const lowerTotal = lowerH * 60 + lowerM;
  const upperTotal = upperH * 60 + upperM;
  const span = Math.max(0, upperTotal - lowerTotal);
  const chunkSize = span / count;
  const dayStart = day.startOf("day");

  const times: DateTime[] = [];
  for (let i = 0; i < count; i++) {
    const chunkStart = lowerTotal + chunkSize * i;
    const chunkEnd = lowerTotal + chunkSize * (i + 1);
    const randomMinutes = Math.floor(
      Math.random() * (chunkEnd - chunkStart) + chunkStart
    );
    times.push(dayStart.plus({
      hours: Math.floor(randomMinutes / 60),
      minutes: randomMinutes % 60,
    }));
  }
  return times;
}

function clampNotificationFrequency(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) &&
    value >= 1 && value <= 4 ? value : 1;
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

        const notificationFrequency = clampNotificationFrequency(
          userData.notificationFrequency
        );
        const timeLower = userData.timeLower || "08:00";
        const timeUpper = userData.timeUpper || "17:00";

        // 1. Load or regenerate today's scheduled times
        const storedDateJS = userData.scheduledRemindersDate?.toDate();
        const storedDate = storedDateJS ?
          DateTime.fromJSDate(storedDateJS).setZone(userTimezone) :
          null;
        const storedTimesRaw: Timestamp[] = userData.scheduledReminderTimes || [];
        const isForToday = storedDate &&
          storedDate >= todayStart &&
          storedDate < todayStart.plus({days: 1}) &&
          storedTimesRaw.length === notificationFrequency;

        let scheduledTimes: DateTime[];
        let notificationsSentToday: number;

        if (isForToday) {
          scheduledTimes = storedTimesRaw.map((ts) =>
            DateTime.fromJSDate(ts.toDate()).setZone(userTimezone)
          );
          notificationsSentToday = userData.notificationsSentToday || 0;
        } else {
          scheduledTimes = generateRandomTimesForDay(
            userNow, timeLower, timeUpper, notificationFrequency
          );
          notificationsSentToday = 0;
          await userRef.update({
            scheduledReminderTimes: scheduledTimes.map((t) =>
              Timestamp.fromDate(t.toJSDate())
            ),
            scheduledRemindersDate: Timestamp.fromDate(todayStart.toJSDate()),
            notificationsSentToday: 0,
          });
        }

        // 2. Skip if all sent today or next one isn't due yet
        if (notificationsSentToday >= notificationFrequency) {
          continue;
        }
        const nextScheduled = scheduledTimes[notificationsSentToday];
        if (userNow < nextScheduled) {
          continue;
        }

        // 3. Send notification — fetch a fresh reminder at send time
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

        const sentAt = Timestamp.now();
        const nextSentCount = notificationsSentToday + 1;
        notificationPromises.push(
          messaging
            .send(message)
            .then(async () => {
              console.log(`Notification sent to user ${userId}`);
              await userRef.update({
                notificationsSentToday: nextSentCount,
                lastNotificationDate: sentAt,
              });
              await addRecentReminder(userId, {
                reminder: randomReminder,
                remindedAt: sentAt,
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
