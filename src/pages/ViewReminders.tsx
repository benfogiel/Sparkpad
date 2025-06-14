import './pages.css';
import '../theme/global.css';

import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  useIonViewWillEnter,
  useIonRouter,
  IonIcon,
  IonText,
  IonHeader,
} from '@ionic/react';

import { auth } from '../firebase';
import { Reminder } from '../data/reminders';
import AddReminder from '../components/AddReminder';
import { ReminderList } from '../components/ReminderList';
import { settingsOutline } from 'ionicons/icons';
import {
  addReminder,
  deleteReminder,
  getUserSelectedCategories,
  getRecentReminders,
  firstReminderSent,
  setFirstReminderSent,
  addRecentReminder,
} from '../services/preferences';
import { scheduleReminder, rescheduleReminders } from '../services/notifications';
import { requestNotificationPermissions } from '../services/notifications';
import { getUser } from '../services/firebaseDB';

const ViewReminders: React.FC = () => {
  const router = useIonRouter();

  const [categories, setCategories] = useState<string[]>([]);
  const [firstName, setFirstName] = useState<string>('');
  const [recentReminders, setRecentReminders] = useState<Reminder[]>([]);

  const loadRecentReminders = async () => {
    const recentReminders = await getRecentReminders();
    setRecentReminders(recentReminders);
  };

  const loadSelectedCategories = async () => {
    const selectedCategories = await getUserSelectedCategories();
    setCategories(selectedCategories);
  };

  const loadFirstName = async () => {
    const user = auth.currentUser;
    if (user) {
      const userData = await getUser(user.uid);
      setFirstName(userData?.firstName || '');
    }
  };

  const setupNotifications = async () => {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const sentFirstReminder = await firstReminderSent();
    if (!sentFirstReminder) {
      const reminderDate = new Date(new Date().getTime() + 100);
      const scheduledReminder = await scheduleReminder(reminderDate);
      if (scheduledReminder) {
        await addRecentReminder(scheduledReminder.reminder);
      }
      await loadRecentReminders();
      await setFirstReminderSent(true);
      // sleep to ensure first reminder is delivered
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await rescheduleReminders();
  };

  useIonViewWillEnter(() => {
    setupNotifications();
    loadSelectedCategories();
    loadFirstName();
    loadRecentReminders();
  });

  const refresh = async (e: CustomEvent) => {
    await loadSelectedCategories();
    await loadFirstName();
    await loadRecentReminders();
    await setupNotifications();
    e.detail.complete();
  };

  const handleAddReminder = async (reminder: Reminder) => {
    await addReminder(reminder);
    await rescheduleReminders();
  };

  const handleDeleteReminder = async (reminder: Reminder) => {
    await deleteReminder(reminder);
    await loadRecentReminders();
    await rescheduleReminders();
  };

  return (
    <IonPage id="reminders-view">
      <IonHeader translucent>
        <div className="page-header view-reminders-header">
          <IonText>
            <p style={{ fontSize: '10px', marginBottom: '0px', marginTop: '0px' }}>
              Welcome Back!
            </p>
            <p style={{ fontSize: '25px', marginTop: '0px' }}>{firstName}</p>
          </IonText>
          <IonIcon
            icon={settingsOutline}
            onClick={() => router.push('/settings')}
            style={{ fontSize: '22px' }}
          />
        </div>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={refresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="reminder-container">
          <AddReminder categories={categories} addReminder={handleAddReminder} />

          <IonText>
            <h5>Past Reminders</h5>
          </IonText>

          <ReminderList
            reminders={recentReminders.reverse()}
            deleteReminder={handleDeleteReminder}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ViewReminders;
