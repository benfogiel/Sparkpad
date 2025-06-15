import './pages.css';
import '../theme/global.css';

import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonItem,
  IonHeader,
  IonText,
  IonIcon,
  useIonRouter,
} from '@ionic/react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  AuthError,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';
import { logoGoogle } from 'ionicons/icons';

import { addReminder, addUser, getUser } from '../services/firebaseDB';
import { getDefaultReminders } from '../data/reminders';

const Auth: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [toggleSignIn, setToggleSignIn] = useState<boolean>(false);
  const router = useIonRouter();

  const createUser = async (firstName: string) => {
    await addUser(firstName);
    const reminders = getDefaultReminders();
    for (const reminder of reminders) {
      await addReminder(reminder);
    }
    router.push('/categories-view');
  };

  const signUp = async (): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.debug('User created:', userCredential.user.uid);
      await createUser(firstName);
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign-up error:', authError.message);
    }
  };

  const signIn = async (): Promise<void> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.debug('User signed in:', userCredential.user.uid);
      router.push('/reminders-view');
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign-in error:', authError.message);
    }
  };

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      console.debug('User signed in:', userCredential.user.uid);
      const user = await getUser();
      if (user) {
        router.push('/reminders-view');
      } else {
        const firstName = userCredential.user.displayName?.split(' ')[0] || '';
        await createUser(firstName);
      }
    } catch (err) {
      const authError = err as AuthError;
      console.error('Sign-in error:', authError.message);
    }
  };

  return (
    <IonPage id="auth-view">
      <IonHeader>
        <div className="page-header">Welcome!</div>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div className="login-container">
          <IonItem lines="none">
            {!toggleSignIn && (
              <IonInput
                className="input-field"
                value={firstName}
                onIonInput={(e) => setFirstName(e.detail.value || '')}
                placeholder="First Name"
              />
            )}
          </IonItem>
          <IonItem lines="none">
            <IonInput
              className="input-field"
              value={email}
              onIonInput={(e) => setEmail(e.detail.value || '')}
              placeholder="Email"
            />
          </IonItem>
          <IonItem lines="none">
            <IonInput
              className="input-field"
              type="password"
              value={password}
              onIonInput={(e) => setPassword(e.detail.value || '')}
              placeholder="Password"
            />
          </IonItem>
          {!toggleSignIn && (
            <IonButton className="button" expand="block" onClick={signUp} color="dark">
              Sign Up
            </IonButton>
          )}
          {toggleSignIn && (
            <IonButton className="button" expand="block" onClick={signIn} color="dark">
              Sign In
            </IonButton>
          )}
          <IonText onClick={() => setToggleSignIn(!toggleSignIn)}>
            <p>
              {toggleSignIn ? (
                <>
                  Don&apos;t have an account? <u>Sign Up</u>
                </>
              ) : (
                <>
                  Already have an account? <u>Sign In</u>
                </>
              )}
            </p>
          </IonText>
          <IonText>OR</IonText>
          <IonItem lines="none" style={{ height: '10px' }}></IonItem>
          <div className="spacer"></div>
          <IonButton
            className="button"
            expand="block"
            onClick={googleSignIn}
            color="dark"
          >
            <IonIcon icon={logoGoogle} style={{ marginRight: '10px' }} />
            Sign In with Google
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Auth;
