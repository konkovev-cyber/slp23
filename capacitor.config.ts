import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.slp23.app',
  appName: 'Личность ПЛЮС',
  webDir: 'dist',
  server: {
    // APK запускается со страницы входа в дневник
    appStartPath: '/school/login'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: "#FAFBFF",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Browser: {
      openStyle: 'normal',
    },
  },
};

export default config;
