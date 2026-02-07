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
  IonLoading,
  useIonRouter,
} from '@ionic/react';
import {
  AuthError,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { FirebaseAuthentication as fireAuth } from '@capacitor-firebase/authentication';
import { logoGoogle } from 'ionicons/icons';

import { addRemindersBatch, addUser, getUser } from '../services/firebaseDB';
import { getDefaultReminders } from '../data/reminders';
import { auth } from '../firebase';

const Auth: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [toggleSignIn, setToggleSignIn] = useState<boolean>(false);
  const [errorLabel, setErrorLabel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useIonRouter();

  const createUser = async (firstName: string) => {
    await addUser(firstName);
    const reminders = getDefaultReminders();
    await addRemindersBatch(reminders);
    router.push('/categories-view', 'root', 'replace');
  };

  const signUp = async (): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await fireAuth.createUserWithEmailAndPassword({
        email,
        password,
      });
      if (userCredential.user) {
        console.debug('User created:', userCredential.user.uid);
        // Sign in to JS SDK to ensure Firestore access works
        await signInWithEmailAndPassword(auth, email, password);
        await createUser(firstName);
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign-up error:', authError.message);
      if (authError.code == 'auth/email-already-in-use') {
        setErrorLabel('Email already in use');
      } else if (authError.code == 'auth/invalid-email') {
        setErrorLabel('Invalid email');
      } else if (authError.code == 'auth/weak-password') {
        setErrorLabel('Password must be at least 6 characters long');
      } else {
        setErrorLabel(authError.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await fireAuth.signInWithEmailAndPassword({
        email,
        password,
      });
      if (userCredential.user) {
        console.debug('User signed in:', userCredential.user.uid);
        // Sign in to JS SDK to ensure Firestore access works
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/reminders-view', 'root', 'replace');
      } else {
        setErrorLabel('Invalid email or password');
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign-in error:', authError.message);
      if (authError.code == 'auth/invalid-credential') {
        setErrorLabel('Invalid email or password');
      } else {
        setErrorLabel(authError.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      const result = await fireAuth.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (idToken) {
        // Sync with JS SDK
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);

        if (result.user) {
          console.debug('User signed in:', result.user.uid);

          const user = await getUser();
          if (user) {
            router.push('/reminders-view', 'root', 'replace');
          } else {
            const firstName = userCredential.user.displayName?.split(' ')[0] || '';
            await createUser(firstName);
          }
        }
      }
    } catch (err) {
      const authError = err as AuthError;
      console.error('Sign-in error:', authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage id="auth-view">
      <IonHeader>
        <div className="page-header">Welcome to Sparkpad!</div>
      </IonHeader>

      <IonLoading isOpen={loading} />
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
          {errorLabel && <IonText color="danger">{errorLabel}</IonText>}
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
