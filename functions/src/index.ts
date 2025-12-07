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

/**
 * Get a random time between two times
 * @param {string} timeLower - The lower time in HH:mm format
 * @param {string} timeUpper - The upper time in HH:mm format
 * @returns {hours: number, minutes: number} - A random time between the two times
 */
function getRandomTime(
  timeLower: string,
  timeUpper: string
): { hours: number; minutes: number } {
  const [lowerHours, lowerMinutes] = timeLower.split(":").map(Number);
  const [upperHours, upperMinutes] = timeUpper.split(":").map(Number);

  const lowerTotalMinutes = lowerHours * 60 + lowerMinutes;
  const upperTotalMinutes = upperHours * 60 + upperMinutes;

  const randomMinutes =
    Math.floor(Math.random() * (upperTotalMinutes - lowerTotalMinutes + 1)) +
    lowerTotalMinutes;

  return {
    hours: Math.floor(randomMinutes / 60),
    minutes: randomMinutes % 60,
  };
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

        const userTimezone = userData.timezone || "UTC";
        const userTime = now.setZone(userTimezone);
        const currentHours = userTime.hour;
        const currentMinutes = userTime.minute;
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        const lastNotification = userData.lastNotificationDate?.toDate();
        const todayInUserTimezone = userTime.startOf("day").toJSDate();

        // Skip if already notified today
        if (lastNotification && lastNotification >= todayInUserTimezone) {
          continue;
        }

        const timeLower = userData.timeLower || "09:00";
        const timeUpper = userData.timeUpper || "21:00";

        // Generate random time for today
        const randomTime = getRandomTime(timeLower, timeUpper);
        const randomTotalMinutes = randomTime.hours * 60 + randomTime.minutes;

        // Skip if current time is not within 15 minutes of random time
        if (Math.abs(currentTotalMinutes - randomTotalMinutes) > 15) {
          continue;
        }

        const remindersSnapshot = await db.collection(`users/${userId}/reminders`).get();
        if (remindersSnapshot.empty) {
          console.log(`No reminders found for user ${userId}`);
          continue;
        }

        // Select random reminder
        const reminders = remindersSnapshot.docs;
        const randomIndex = Math.floor(Math.random() * reminders.length);
        const randomReminder = reminders[randomIndex].data();

        const fcmToken = userData.fcmToken;
        if (!fcmToken) {
          console.log(`No FCM token found for user ${userId}`);
          continue;
        }

        const message: admin.messaging.Message = {
          token: fcmToken,
          notification: {
            title: "Daily Reminder",
            body: randomReminder.text,
          },
          data: {
            reminderId: reminders[randomIndex].id,
            timestamp: Timestamp.now().toMillis().toString(),
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              clickAction: "FLUTTER_NOTIFICATION_CLICK",
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

        // Send notification and update last notification date
        notificationPromises.push(
          messaging
            .send(message)
            .then(async () => {
              console.log(`Notification sent to user ${userId}`);
              await db
                .collection("users")
                .doc(userId)
                .update({
                  lastNotificationDate: Timestamp.fromDate(todayInUserTimezone),
                });
            })
            .catch((error) => {
              console.error(`Error sending notification to user ${userId}:`, error);
            })
        );
      }

      await Promise.all(notificationPromises);

      console.log("Random reminders processed successfully");
    } catch (error) {
      console.error("Error processing random reminders:", error);
    }
  }
);
