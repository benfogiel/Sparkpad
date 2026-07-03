import './pages.css';
import '../theme/global.css';

import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonButton,
  useIonRouter,
  IonFooter,
  IonLabel,
  IonList,
  IonListHeader,
  IonItem,
  IonIcon,
  useIonViewWillEnter,
} from '@ionic/react';
import { arrowBackOutline, chevronDownOutline } from 'ionicons/icons';

import { FirebaseAuthentication as fireAuth } from '@capacitor-firebase/authentication';
import { auth } from '../firebase';
import {
  getNotificationFrequency,
  setNotificationFrequency,
  NotificationFrequency,
} from '../services/firebaseDB';

const FREQUENCY_OPTIONS: { value: NotificationFrequency; label: string }[] = [
  { value: 1, label: 'Once per day' },
  { value: 2, label: 'Twice per day' },
  { value: 3, label: 'Three times per day' },
  { value: 4, label: 'Four times per day' },
];

const Settings: React.FC = () => {
  const router = useIonRouter();
  const [notificationFrequency, setNotificationFrequencyState] =
    useState<NotificationFrequency>(1);
  const [isFrequencyExpanded, setIsFrequencyExpanded] = useState(false);

  useIonViewWillEnter(() => {
    getNotificationFrequency().then(setNotificationFrequencyState);
  });

  const onFrequencyOptionClick = async (value: NotificationFrequency) => {
    if (value === notificationFrequency) {
      setIsFrequencyExpanded((prev) => !prev);
      return;
    }
    setNotificationFrequencyState(value);
    setIsFrequencyExpanded(false);
    await setNotificationFrequency(value);
  };

  const orderedFrequencyOptions = [
    ...FREQUENCY_OPTIONS.filter((o) => o.value === notificationFrequency),
    ...FREQUENCY_OPTIONS.filter((o) => o.value !== notificationFrequency),
  ];

  return (
    <IonPage id="settings-view">
      <IonHeader>
        <div className="page-header">
          <IonIcon
            icon={arrowBackOutline}
            style={{ position: 'absolute', left: '16px', fontSize: '24px' }}
            onClick={() => router.push('/reminders-view', 'back', 'pop')}
          />
          Settings
        </div>
      </IonHeader>

      <IonContent fullscreen scrollY={false}>
        <IonList>
          <IonItem>
            <IonLabel onClick={() => router.push('/categories-view')}>
              Categories
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel onClick={() => router.push('/quotes-view')}>Quotes</IonLabel>
          </IonItem>
        </IonList>

        <IonList className="frequency-list">
          <IonListHeader>
            <IonLabel>Notification Frequency</IonLabel>
          </IonListHeader>
          {orderedFrequencyOptions.map((option) => {
            const isSelected = option.value === notificationFrequency;
            const isHidden = !isFrequencyExpanded && !isSelected;
            return (
              <IonItem
                key={option.value}
                button
                detail={false}
                onClick={() => onFrequencyOptionClick(option.value)}
                className={`frequency-option${isSelected ? ' selected' : ''}${
                  isHidden ? ' hidden' : ''
                }`}
              >
                <IonLabel>{option.label}</IonLabel>
                {isSelected && (
                  <IonIcon
                    slot="end"
                    icon={chevronDownOutline}
                    className={
                      'frequency-chevron' +
                      (isFrequencyExpanded ? ' expanded' : '')
                    }
                  />
                )}
              </IonItem>
            );
          })}
        </IonList>
      </IonContent>

      <IonFooter className="page-footer">
        <IonButton
          className="bottom-button"
          color="dark"
          expand="block"
          onClick={async () => {
            await fireAuth.signOut();
            await auth.signOut();
            router.push('/auth', 'root', 'replace');
          }}
        >
          Log Out
        </IonButton>
      </IonFooter>
    </IonPage>
  );
};

export default Settings;
