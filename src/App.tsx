import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useAuthState } from 'react-firebase-hooks/auth';

import ViewCategories from './pages/ViewCategories';
import ViewReminders from './pages/ViewReminders';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import { auth } from './firebase';
import { getReminders, setReminders } from './services/preferences';
import { getDefaultReminders } from './data/reminders';

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

const App: React.FC = () => {
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    const loadReminders = async () => {
      const reminders = await getReminders();
      if (reminders.length === 0) {
        const defaultReminders = getDefaultReminders();
        await setReminders(defaultReminders);
      }
    };

    loadReminders();
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/" exact={true}>
            {loading ? null : user ? (
              <Redirect to="/reminders-view" />
            ) : (
              <Redirect to="/auth" />
            )}
          </Route>
          <Route path="/auth" exact={true}>
            <Auth />
          </Route>
          <Route path="/categories-view" exact={true}>
            <ViewCategories />
          </Route>
          <Route path="/reminders-view" exact={true}>
            <ViewReminders />
          </Route>
          <Route path="/settings" exact={true}>
            <Settings />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
