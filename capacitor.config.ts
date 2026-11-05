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
    // Barras del sistema (complemento incluido en Capacitor 8): pantalla completa como en los juegos, sin barra de
    // notificaciones ni de navegación. MainActivity las deja volver un momento al deslizar desde el borde y las
    // esconde otra vez. Íconos claros por si se asoman sobre el fondo azul oscuro.
    SystemBars: {
      hidden: true,
      style: 'DARK',
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
