import './pages.css';
import '../theme/global.css';

import React, { useState } from 'react';
import {
  IonContent,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  useIonViewWillEnter,
  IonButton,
  useIonRouter,
  IonItem,
  IonHeader,
  IonFooter,
} from '@ionic/react';

import { getDefaultCategories } from '../data/reminders';
import { CategoryCheckboxItem } from '../components/CategoryItem';
import { firstReminderSent } from '../services/preferences';
import { rescheduleReminders } from '../services/notifications';
import { getSelectedCategories, setSelectedCategories } from '../services/firebaseDB';

const ViewCategories: React.FC = () => {
  const router = useIonRouter();

  const [categories, setCategories] = useState<string[]>([]);
  const [userSelectedCategories, setUserSelectedCategories] = useState<string[]>([]);

  const loadSelectedCategories = async () => {
    const userSelectedCategories = await getSelectedCategories();
    setUserSelectedCategories(userSelectedCategories);
  };

  const loadCategories = async () => {
    const categories = getDefaultCategories();
    setCategories(categories);
  };

  useIonViewWillEnter(() => {
    loadSelectedCategories();
    loadCategories();
  });

  const refresh = async (e: CustomEvent) => {
    await loadSelectedCategories();
    await loadCategories();
    e.detail.complete();
  };

  const onCategorySelect = (c: string) => {
    if (userSelectedCategories.includes(c)) {
      setUserSelectedCategories((prev) => prev.filter((category) => category !== c));
    } else {
      setUserSelectedCategories((prev) => [...prev, c]);
    }
  };

  const onSave = async () => {
    const sentFirstReminder = await firstReminderSent();
    if (sentFirstReminder) {
      rescheduleReminders();
    }

    setSelectedCategories(userSelectedCategories);
    router.push('/reminders-view');
  };

  return (
    <IonPage id="categories-view">
      <IonHeader translucent>
        <div className="page-header">Choose Your Inspiration</div>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={refresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonList lines="inset">
          {categories.map((c) => (
            <IonItem key={c}>
              <CategoryCheckboxItem
                category={c}
                selected={userSelectedCategories.includes(c)}
                onSelect={() => onCategorySelect(c)}
              />
            </IonItem>
          ))}
        </IonList>
      </IonContent>

      <IonFooter className="page-footer">
        <IonButton
          className="bottom-button"
          color="dark"
          expand="block"
          onClick={onSave}
          disabled={userSelectedCategories.length === 0}
        >
          Save
        </IonButton>
      </IonFooter>
    </IonPage>
  );
};

export default ViewCategories;
