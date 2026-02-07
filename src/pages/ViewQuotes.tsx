import './pages.css';
import '../theme/global.css';

import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonList,
  IonAlert,
  IonText,
  useIonViewWillEnter,
  useIonRouter,
} from '@ionic/react';
import { arrowBackOutline, close } from 'ionicons/icons';

import { Reminder } from '../data/reminders';
import { getReminders, deleteReminder } from '../services/firebaseDB';

const ViewQuotes: React.FC = () => {
  const router = useIonRouter();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

  const loadReminders = async () => {
    const allReminders = await getReminders();
    setReminders(allReminders);
  };

  useIonViewWillEnter(() => {
    loadReminders();
  });

  const refresh = async (e: CustomEvent) => {
    await loadReminders();
    e.detail.complete();
  };

  const handleDeleteReminder = async () => {
    if (reminderToDelete) {
      await deleteReminder(reminderToDelete.id);
      await loadReminders();
    }
  };

  const groupedByCategory = reminders.reduce<Record<string, Reminder[]>>(
    (acc, reminder) => {
      const category = reminder.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(reminder);
      return acc;
    },
    {}
  );

  const sortedCategories = Object.keys(groupedByCategory).sort();

  return (
    <IonPage id="quotes-view">
      <IonHeader>
        <div className="page-header">
          <IonIcon
            icon={arrowBackOutline}
            style={{ position: 'absolute', left: '16px', fontSize: '24px' }}
            onClick={() => router.push('/settings', 'back', 'pop')}
          />
          Quotes
        </div>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={refresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {reminders.length === 0 ? (
          <IonText className="text-center">
            <p>No quotes found</p>
          </IonText>
        ) : (
          <IonAccordionGroup>
            {sortedCategories.map((category) => (
              <IonAccordion key={category} value={category}>
                <IonItem slot="header">
                  <IonLabel>
                    {category} ({groupedByCategory[category].length})
                  </IonLabel>
                </IonItem>
                <IonList slot="content">
                  {groupedByCategory[category].map((reminder) => (
                    <IonItem key={reminder.id}>
                      <IonLabel className="ion-text-wrap">{reminder.quote}</IonLabel>
                      <IonIcon
                        icon={close}
                        onClick={() => {
                          setReminderToDelete(reminder);
                          setOpenDeleteAlert(true);
                        }}
                      />
                    </IonItem>
                  ))}
                </IonList>
              </IonAccordion>
            ))}
          </IonAccordionGroup>
        )}

        <IonAlert
          header="Are you sure?"
          message={
            'This will delete the reminder from your list ' +
            "and you'll never be notified about it again."
          }
          isOpen={openDeleteAlert}
          buttons={[
            {
              text: 'Cancel',
            },
            {
              text: 'Yes',
              handler: () => handleDeleteReminder(),
            },
          ]}
          onDidDismiss={() => {
            setOpenDeleteAlert(false);
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default ViewQuotes;
