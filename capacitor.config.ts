import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geospeed.challenge',
  appName: 'GeoSpeed IQ Challenge',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#07130a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#07130a',
    },
    Keyboard: {
      resize: 'body',
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'GeoSpeed',
  },
  android: {
    backgroundColor: '#07130a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
