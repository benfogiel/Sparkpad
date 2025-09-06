import './AddReminder.css';

import React, { useState, FC, useRef } from 'react';
import {
  IonTextarea,
  IonIcon,
  IonModal,
  IonButton,
  IonList,
  IonItem,
  IonBadge,
  IonToast,
} from '@ionic/react';
import { v4 as uuidv4 } from 'uuid';

import { Reminder } from '../data/reminders';
import { list } from 'ionicons/icons';
import { CategoryRadioItem } from './CategoryItem';

interface AddReminderProps {
  categories: string[];
  addReminder: (reminder: Reminder) => void;
}

export const AddReminder: FC<AddReminderProps> = ({ categories, addReminder }) => {
  const selectCategoryModal = useRef<HTMLIonModalElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [quote, setQuote] = useState<string>('');
  const [showReminderAddedToast, setShowReminderAddedToast] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const onCategorySelect = (c: string) => {
    setSelectedCategory(c);
    selectCategoryModal.current?.dismiss();
  };

  const handleAddReminder = () => {
    if (quote && selectedCategory) {
      addReminder({ id: uuidv4(), quote, category: selectedCategory });
      setQuote('');
      setSelectedCategory('');
      setShowReminderAddedToast(true);
    } else if (quote && !selectedCategory) {
      setModalOpen(true);
    }
  };

  return (
    <div id="add-reminder-container">
      <div
        id="add-reminder-header"
        onClick={() => selectCategoryModal.current?.present()}
      >
        {selectedCategory ? (
          <IonBadge color="primary">{selectedCategory}</IonBadge>
        ) : (
          <IonIcon icon={list} />
        )}
      </div>
      <IonTextarea
        label="Add your reminder"
        labelPlacement="floating"
        value={quote}
        onIonInput={(e) => setQuote(e.detail.value || '')}
        autoGrow={true}
        rows={4}
      ></IonTextarea>

      <IonButton color="dark" size="small" onClick={handleAddReminder}>
        Add
      </IonButton>
      <IonModal
        ref={selectCategoryModal}
        isOpen={modalOpen}
        onDidDismiss={() => setModalOpen(false)}
        initialBreakpoint={1}
        breakpoints={[0, 1]}
      >
        <div className="modal-content">
          <IonList lines="inset">
            {categories.map((c) => (
              <IonItem key={c}>
                <CategoryRadioItem
                  category={c}
                  selected={selectedCategory === c}
                  onSelect={() => onCategorySelect(c)}
                />
              </IonItem>
            ))}
          </IonList>
        </div>
      </IonModal>
      <IonToast
        isOpen={showReminderAddedToast}
        onDidDismiss={() => setShowReminderAddedToast(false)}
        message="Reminder added!"
        duration={1000}
        position="top"
      />
    </div>
  );
};

export default AddReminder;
