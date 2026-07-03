import './ReminderList.css';

import React, { useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonAlert,
  IonText,
  IonModal,
  IonBadge,
  IonButton,
  IonToast,
} from '@ionic/react';
import { copyOutline, trashOutline } from 'ionicons/icons';
import { Clipboard } from '@capacitor/clipboard';

import { Reminder } from '../data/reminders';
import { CategoryRadioItem } from './CategoryItem';

interface ReminderListProps {
  reminders: Reminder[];
  categories: string[];
  deleteReminder: (reminder: Reminder) => void;
  updateReminderCategory: (reminder: Reminder, category: string) => void;
}

export const ReminderList: React.FC<ReminderListProps> = ({
  reminders,
  categories,
  deleteReminder,
  updateReminderCategory,
}) => {
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [openReminderDetailModal, setOpenReminderDetailModal] = useState(false);
  const [openSelectCategoryModal, setOpenSelectCategoryModal] = useState(false);
  const [openDeleteReminderAlert, setOpenDeleteReminderAlert] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const handleCopyQuote = async () => {
    if (selectedReminder) {
      await Clipboard.write({ string: selectedReminder.quote });
      setShowCopiedToast(true);
    }
  };

  const handleDeleteReminder = () => {
    if (selectedReminder) {
      deleteReminder(selectedReminder);
      setOpenReminderDetailModal(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (selectedReminder && category !== selectedReminder.category) {
      updateReminderCategory(selectedReminder, category);
      setSelectedReminder({ ...selectedReminder, category });
    }
    setOpenSelectCategoryModal(false);
  };

  return (
    <div id="reminder-list-container">
      {reminders.length > 0 ? (
        <IonList>
          {reminders.map((reminder) => (
            <IonItem
              key={reminder.quote}
              button
              detail={false}
              onClick={() => {
                setSelectedReminder(reminder);
                setOpenReminderDetailModal(true);
              }}
            >
              <IonLabel>{reminder.quote}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      ) : (
        <IonText className="text-center">
          <p>No reminders notified yet</p>
        </IonText>
      )}

      <IonModal
        isOpen={openReminderDetailModal}
        onDidDismiss={() => setOpenReminderDetailModal(false)}
        initialBreakpoint={1}
        breakpoints={[0, 1]}
      >
        <div className="modal-content reminder-detail">
          <IonBadge color="primary" onClick={() => setOpenSelectCategoryModal(true)}>
            {selectedReminder?.category}
          </IonBadge>
          <IonText>
            <p className="reminder-detail-quote">{selectedReminder?.quote}</p>
          </IonText>
          <div className="reminder-detail-actions">
            <IonButton color="dark" size="small" onClick={handleCopyQuote}>
              <IonIcon slot="start" icon={copyOutline} />
              Copy
            </IonButton>
            <IonButton
              color="danger"
              size="small"
              onClick={() => setOpenDeleteReminderAlert(true)}
            >
              <IonIcon slot="start" icon={trashOutline} />
              Delete
            </IonButton>
          </div>
        </div>
      </IonModal>

      <IonModal
        isOpen={openSelectCategoryModal}
        onDidDismiss={() => setOpenSelectCategoryModal(false)}
        initialBreakpoint={1}
        breakpoints={[0, 1]}
      >
        <div className="modal-content">
          <IonList lines="inset">
            {categories.map((c) => (
              <IonItem key={c}>
                <CategoryRadioItem
                  category={c}
                  selected={selectedReminder?.category === c}
                  onSelect={() => handleCategorySelect(c)}
                />
              </IonItem>
            ))}
          </IonList>
        </div>
      </IonModal>

      <IonAlert
        header="Are you sure?"
        message={
          'This will delete the reminder from your list ' +
          "and you'll never be notified about it again."
        }
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

      <IonToast
        isOpen={showCopiedToast}
        onDidDismiss={() => setShowCopiedToast(false)}
        message="Copied to clipboard!"
        duration={1000}
        position="top"
      />
    </div>
  );
};
