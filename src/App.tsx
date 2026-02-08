import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonLoading, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useAuthState } from 'react-firebase-hooks/auth';

import ViewCategories from './pages/ViewCategories';
import ViewReminders from './pages/ViewReminders';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import ViewQuotes from './pages/ViewQuotes';
import { auth } from './firebase';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const AUTH_TIMEOUT_MS = 3000;

const App: React.FC = () => {
  const [user, loading, error] = useAuthState(auth);
  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (loading) {
      console.log('AuthState loading...');
    }
    if (user) {
      console.log('AuthState user loaded:', user.uid);
    }
    if (error) {
      console.error('AuthState error:', error);
    }
  }, [user, loading, error]);

  if (loading && !timedOut) {
    return (
      <IonApp>
        <IonLoading isOpen={true} message="Loading..." />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/" exact={true}>
            {user ? <Redirect to="/reminders-view" /> : <Redirect to="/auth" />}
          </Route>
          <Route path="/auth" exact={true}>
            <Auth />
          </Route>
          <Route path="/categories-view" exact={true}>
            {user ? <ViewCategories /> : <Redirect to="/auth" />}
          </Route>
          <Route path="/reminders-view" exact={true}>
            {user ? <ViewReminders /> : <Redirect to="/auth" />}
          </Route>
          <Route path="/settings" exact={true}>
            {user ? <Settings /> : <Redirect to="/auth" />}
          </Route>
          <Route path="/quotes-view" exact={true}>
            {user ? <ViewQuotes /> : <Redirect to="/auth" />}
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
