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

import { FirebaseAuthentication as fireAuth } from '@capacitor-firebase/authentication';
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
