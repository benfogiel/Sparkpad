import './ReminderList.css';

import React, { useState } from 'react';
import { IonList, IonItem, IonLabel, IonIcon, IonAlert, IonText } from '@ionic/react';
import { close } from 'ionicons/icons';

import { Reminder } from '../data/reminders';

interface ReminderListProps {
  reminders: Reminder[];
  deleteReminder: (reminder: Reminder) => void;
}

export const ReminderList: React.FC<ReminderListProps> = ({
  reminders,
  deleteReminder,
}) => {
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);
  const [openDeleteReminderAlert, setOpenDeleteReminderAlert] = useState(false);

  const handleDeleteReminder = () => {
    if (reminderToDelete) {
      deleteReminder(reminderToDelete);
    }
  };

  return (
    <div id="reminder-list-container">
      {reminders.length > 0 ? (
        <IonList>
          {reminders.map((reminder) => (
            <IonItem key={reminder.quote}>
              <IonLabel>{reminder.quote}</IonLabel>
              <IonIcon
                icon={close}
                onClick={() => {
                  setReminderToDelete(reminder);
                  setOpenDeleteReminderAlert(true);
                }}
              />
            </IonItem>
          ))}
        </IonList>
      ) : (
        <IonText className="text-center">
          <p>No reminders notified yet</p>
        </IonText>
      )}

      <IonAlert
        header="Are you sure?"
        message="This will delete the reminder from your list."
        isOpen={openDeleteReminderAlert}
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
          setOpenDeleteReminderAlert(false);
        }}
      ></IonAlert>
    </div>
  );
};
