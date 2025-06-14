# reemind

## Development

### Building for iOS

```
npm run build
ionic cap sync
```

if you haven't added the ios platform yet, run:

```
ionic cap add ios
```

then open the iOS project in Xcode:

```
ionic cap open ios
```

NOTE: Apple mandates that app developers now specify approved reasons for API usage to enhance user privacy. PrivacyInfo.xcprivacy file must be added to /ios/App with the following:

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
      <!-- Add this dict entry to the array if the PrivacyInfo file already exists -->
      <dict>
        <key>NSPrivacyAccessedAPIType</key>
        <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
        <key>NSPrivacyAccessedAPITypeReasons</key>
        <array>
          <string>CA92.1</string>
        </array>
      </dict>
    </array>
  </dict>
</plist>
```

### Required Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```
