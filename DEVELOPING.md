# Developing Sparkpad

## Development

### Building for iOS

```
npm run build:ios
```

### Setting up Firebase Authentication

TODO: there is more to do here, but this is a start.

#### Setup Google Authentication

capacitor-firebase/authentication [documentation](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/docs/setup-google.md)

Add custom URL schemes to your Xcode project:

Open your project configuration. Select your app from the TARGETS section, then select the Info tab, and expand the URL Types section.
Click the + button, and add a URL scheme for your reversed client ID. You find this value in your GoogleService-Info.plist configuration file. Look for the REVERSED_CLIENT_ID key and paste the value of that key into the URL Schemes box on the configuration page. Leave the other fields blank.

### Deploy Firestore Rules

```
npx firebase deploy --only firestore
```

### Setup APNs for iOS Push Notifications

Push notifications via TestFlight/App Store require an APNs Authentication Key uploaded to Firebase.

1. Go to [Apple Developer - Keys](https://developer.apple.com/account/resources/authkeys/list) and create a new key with **Apple Push Notifications service (APNs)** enabled
2. Download the `.p8` file (only available once)
3. Note the **Key ID** from the key details page
4. In [Firebase Console](https://console.firebase.google.com) -> **Project Settings** -> **Cloud Messaging** -> your iOS app, upload the `.p8` file, the Key ID, and your Team ID

Without this, notifications will work from Xcode (development APNs) but fail from TestFlight/App Store (production APNs).

### Deploy Firebase Functions

```
npm run deploy:functions
```
