import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.sparkpad',
  appName: 'Sparkpad',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: 'none',
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
