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
  IonIcon,
  IonLabel,
  IonAlert,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { arrowBackOutline, addOutline } from 'ionicons/icons';

import { toTitleCase } from '../data/reminders';
import { CategoryCheckboxItem } from '../components/CategoryItem';
import {
  getCategories,
  setCategories as saveCategories,
  getSelectedCategories,
  setSelectedCategories,
} from '../services/firebaseDB';

const ViewCategories: React.FC = () => {
  const router = useIonRouter();
  const location = useLocation();
  const fromSettings = new URLSearchParams(location.search).get('from') === 'settings';

  const [categories, setCategories] = useState<string[]>([]);
  const [userSelectedCategories, setUserSelectedCategories] = useState<string[]>([]);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const load = async () => {
    setCategories(await getCategories());
    setUserSelectedCategories(await getSelectedCategories());
  };

  useIonViewWillEnter(() => {
    load();
  });

  const refresh = async (e: CustomEvent) => {
    await load();
    e.detail.complete();
  };

  const onCategorySelect = (c: string) => {
    const next = userSelectedCategories.includes(c)
      ? userSelectedCategories.filter((category) => category !== c)
      : [...userSelectedCategories, c];
    setUserSelectedCategories(next);
    if (fromSettings) {
      setSelectedCategories(next);
    }
  };

  const onAddCategory = async (name: string) => {
    const category = toTitleCase(name.trim());
    if (!category || categories.includes(category)) return;
    const nextCategories = [...categories, category];
    const nextSelected = [...userSelectedCategories, category];
    setCategories(nextCategories);
    setUserSelectedCategories(nextSelected);
    await saveCategories(nextCategories);
    if (fromSettings) {
      await setSelectedCategories(nextSelected);
    }
  };

  const onDeleteCategory = async (category: string) => {
    const nextCategories = categories.filter((c) => c !== category);
    const nextSelected = userSelectedCategories.filter((c) => c !== category);
    setCategories(nextCategories);
    setUserSelectedCategories(nextSelected);
    await saveCategories(nextCategories);
    if (fromSettings) {
      await setSelectedCategories(nextSelected);
    }
  };

  const onSave = async () => {
    await setSelectedCategories(userSelectedCategories);
    router.push('/reminders-view', 'root', 'replace');
  };

  return (
    <IonPage id="categories-view">
      <IonHeader>
        <div className="page-header">
          {fromSettings ? (
            <>
              <IonIcon
                icon={arrowBackOutline}
                style={{ position: 'absolute', left: '16px', fontSize: '24px' }}
                onClick={() => router.push('/settings', 'back', 'pop')}
              />
              Categories
            </>
          ) : (
            'Choose Your Inspiration'
          )}
        </div>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={refresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonList lines="inset">
          {categories.map((c) => (
            <IonItemSliding key={c} disabled={!fromSettings}>
              <IonItem>
                <CategoryCheckboxItem
                  category={c}
                  selected={userSelectedCategories.includes(c)}
                  onSelect={() => onCategorySelect(c)}
                />
              </IonItem>
              <IonItemOptions side="end">
                <IonItemOption color="danger" onClick={() => setCategoryToDelete(c)}>
                  Delete
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
          {fromSettings && (
            <IonItem button detail={false} onClick={() => setShowAddAlert(true)}>
              <IonIcon icon={addOutline} slot="start" />
              <IonLabel>Add Category</IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonContent>

      {!fromSettings && (
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
      )}

      <IonAlert
        isOpen={showAddAlert}
        header="Add Category"
        inputs={[{ name: 'category', type: 'text', placeholder: 'Category name' }]}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Add', handler: (data) => onAddCategory(data.category) },
        ]}
        onDidDismiss={() => setShowAddAlert(false)}
      />

      <IonAlert
        isOpen={categoryToDelete !== null}
        header="Delete category?"
        message={`"${categoryToDelete}" will be removed from your categories.`}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Delete',
            handler: () => {
              if (categoryToDelete) onDeleteCategory(categoryToDelete);
            },
          },
        ]}
        onDidDismiss={() => setCategoryToDelete(null)}
      />
    </IonPage>
  );
};

export default ViewCategories;
