import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

import { db, auth } from '../firebase';
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
  const docRef = doc(db, 'users', auth.currentUser!.uid);
  await setDoc(docRef, { firstName, createdAt: new Date(), selectedCategories: [] });
};

export const getReminders = async () => {
  assertUser();
  const remindersRef = collection(db, 'users', auth.currentUser!.uid, 'reminders');
  const querySnapshot = await getDocs(remindersRef);
  return querySnapshot.docs.map((doc) => doc.data() as Reminder);
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
