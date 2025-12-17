import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';

import { db, auth, messaging } from '../firebase';
import { Reminder } from '../data/reminders';

const assertUser = () => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }
};

export const getUser = async () => {
  assertUser();
  const docRef = doc(db, 'users', auth.currentUser!.uid);
  const docSnap = await getDoc(docRef);
  return docSnap.data();
};

export const addUser = async (firstName: string) => {
  assertUser();
  let fcmToken = '';

  try {
    if (Capacitor.isNativePlatform()) {
      const { token } = await FirebaseMessaging.getToken();
      fcmToken = token;
    } else if (messaging) {
      fcmToken = await getToken(messaging);
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }

  const docRef = doc(db, 'users', auth.currentUser!.uid);
  await setDoc(docRef, {
    firstName,
    fcmToken: fcmToken,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    createdAt: new Date(),
    selectedCategories: [],
  });
};

export const getReminders = async () => {
  assertUser();
  console.debug('querying reminders for user', auth.currentUser!.uid);
  const remindersRef = collection(db, 'users', auth.currentUser!.uid, 'reminders');
  const querySnapshot = await getDocs(remindersRef);
  return querySnapshot.docs.map((doc) => doc.data() as Reminder);
};

export const waitForUserReminders = async (
  timeout: number = 5000
): Promise<Reminder[] | null> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const reminders = await getReminders();
    if (reminders.length > 0) {
      return reminders;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return null;
};

export const addReminder = async (reminder: Reminder) => {
  assertUser();
  const reminderRef = doc(db, 'users', auth.currentUser!.uid, 'reminders', reminder.id);
  await setDoc(reminderRef, reminder);
};

export const deleteReminder = async (reminderId: string) => {
  assertUser();
  const reminderRef = doc(db, 'users', auth.currentUser!.uid, 'reminders', reminderId);
  await deleteDoc(reminderRef);
  await deleteRecentReminder(reminderId);
};

export const setSelectedCategories = async (categories: string[]) => {
  assertUser();
  const docRef = doc(db, 'users', auth.currentUser!.uid);
  await updateDoc(docRef, { selectedCategories: categories });
};

export const getSelectedCategories = async () => {
  assertUser();
  const docRef = doc(db, 'users', auth.currentUser!.uid);
  const docSnap = await getDoc(docRef);
  return docSnap.data()?.selectedCategories || [];
};

// ---------------- Recent Reminders ----------------

interface RecentReminder {
  reminder: Reminder;
  remindedAt: Timestamp;
}

const tooManyRecentReminders = (numRecentReminders: number): boolean => {
  return numRecentReminders > parseInt(import.meta.env.VITE_MAX_RECENT_REMINDERS || '10');
};

export const getRecentReminders = async (): Promise<RecentReminder[]> => {
  assertUser();
  const collectionRef = collection(db, 'users', auth.currentUser!.uid, 'recentReminders');
  const querySnapshot = await getDocs(collectionRef);
  const recentReminders = querySnapshot.docs.map((doc) => doc.data() as RecentReminder);
  return await trimRecentReminders(recentReminders);
};

export const addRecentReminder = async (reminder: Reminder) => {
  assertUser();
  // if there's already a recent reminder for this reminder.id, replace it
  const recentReminders = await getRecentReminders();
  const duplicateReminder = recentReminders.find(
    (r: RecentReminder) => r.reminder.id === reminder.id
  );
  if (duplicateReminder) {
    await deleteRecentReminder(duplicateReminder.reminder.id);
  }

  const newRecentReminder: RecentReminder = {
    reminder: reminder,
    remindedAt: Timestamp.fromDate(new Date()),
  };
  const docRef = doc(db, 'users', auth.currentUser!.uid, 'recentReminders', reminder.id);
  await setDoc(docRef, newRecentReminder);
  recentReminders.push(newRecentReminder);
  await trimRecentReminders(recentReminders);
};

export const deleteRecentReminder = async (reminderId: string) => {
  assertUser();
  const docRef = doc(db, 'users', auth.currentUser!.uid, 'recentReminders', reminderId);
  await deleteDoc(docRef);
};

export const trimRecentReminders = async (
  recentReminders: RecentReminder[] | null = null
): Promise<RecentReminder[]> => {
  assertUser();
  const reminders =
    recentReminders === null ? await getRecentReminders() : recentReminders;
  const sortedRecentReminders = reminders.sort(
    (a: RecentReminder, b: RecentReminder) => a.remindedAt.seconds - b.remindedAt.seconds
  );
  while (tooManyRecentReminders(sortedRecentReminders.length)) {
    // find the oldest recent reminder and remove it
    const oldestRecentReminder = sortedRecentReminders.shift();
    if (oldestRecentReminder) {
      await deleteRecentReminder(oldestRecentReminder.reminder.id);
    }
  }
  return sortedRecentReminders;
};
