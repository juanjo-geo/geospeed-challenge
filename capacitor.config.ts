import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geospeed.challenge',
  appName: 'GeoSpeed Challenge',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#071426',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#071426',
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
    backgroundColor: '#071426',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
