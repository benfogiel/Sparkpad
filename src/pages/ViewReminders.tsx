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

import { Reminder } from '../data/reminders';
import AddReminder from '../components/AddReminder';
import { ReminderList } from '../components/ReminderList';
import { settingsOutline } from 'ionicons/icons';
import { scheduleReminder } from '../services/notifications';
import { requestNotificationPermissions } from '../services/notifications';
import {
  getUser,
  addReminder,
  deleteReminder,
  getSelectedCategories,
  waitForUserReminders,
  getRecentReminders,
  addRecentReminder,
} from '../services/firebaseDB';

const ViewReminders: React.FC = () => {
  const router = useIonRouter();

  const [categories, setCategories] = useState<string[]>([]);
  const [firstName, setFirstName] = useState<string>('');
  const [recentReminders, setRecentReminders] = useState<Reminder[]>([]);

  const loadRecentReminders = async () => {
    console.debug('loading recent reminders...');
    const recentReminders = await getRecentReminders();
    setRecentReminders(recentReminders.map((r) => r.reminder));
  };

  const loadSelectedCategories = async () => {
    console.debug('loading selected categories...');
    const selectedCategories = await getSelectedCategories();
    setCategories(selectedCategories);
  };

  const loadFirstName = async () => {
    console.debug('loading first name...');
    const userData = await getUser();
    setFirstName(userData?.firstName || '');
  };

  const setupNotifications = async () => {
    console.debug('setting up notifications...');
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const reminders = await waitForUserReminders();
    if (!reminders) {
      console.error('No reminders found');
      return;
    }

    const recentReminders = await getRecentReminders();
    if (recentReminders.length === 0) {
      const scheduledReminder = await scheduleReminder();
      if (scheduledReminder) {
        await addRecentReminder(scheduledReminder.reminder);
      }
      await loadRecentReminders();
      // sleep to ensure first reminder is delivered
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
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
  };

  const handleDeleteReminder = async (reminder: Reminder) => {
    await deleteReminder(reminder.id);
    await loadRecentReminders();
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
            <h5>Notified Reminders</h5>
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
