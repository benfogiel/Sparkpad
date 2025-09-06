import './pages.css';
import '../theme/global.css';

import React from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonButton,
  useIonRouter,
  IonFooter,
  IonLabel,
  IonList,
  IonItem,
} from '@ionic/react';

import { auth } from '../firebase';

const Settings: React.FC = () => {
  const router = useIonRouter();

  return (
    <IonPage id="settings-view">
      <IonHeader>
        <div className="page-header">Settings</div>
      </IonHeader>

      <IonContent fullscreen scrollY={false}>
        <IonList>
          <IonItem>
            <IonLabel onClick={() => router.push('/categories-view')}>
              Categories
            </IonLabel>
          </IonItem>
        </IonList>
      </IonContent>

      <IonFooter className="page-footer">
        <IonButton
          className="bottom-button"
          color="dark"
          expand="block"
          onClick={() => {
            auth.signOut();
            router.push('/auth');
          }}
        >
          Log Out
        </IonButton>
      </IonFooter>
    </IonPage>
  );
};

export default Settings;
