# reemind

## Development

### Building for iOS

```
npm run build:ios
```

### Required Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Setting up firebase authenticator

TDOD: there is more to do here, but this is a start.

#### Setup Google Authentication

capacitor-firebase/authentication [documentation](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/docs/setup-google.md)

Add custom URL schemes to your Xcode project:

Open your project configuration. Select your app from the TARGETS section, then select the Info tab, and expand the URL Types section.
Click the + button, and add a URL scheme for your reversed client ID. You find this value in your GoogleService-Info.plist configuration file. Look for the REVERSED_CLIENT_ID key and paste the value of that key into the URL Schemes box on the configuration page. Leave the other fields blank.

### Deploy Firestore Rules

```
npx firebase deploy --only firestore
```