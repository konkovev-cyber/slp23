import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.slp23.app',
  appName: 'Личность ПЛЮС',
  webDir: 'dist',
  server: {
    // APK запускается со страницы входа в дневник
    launchPath: '/school/login'
  },
  plugins: {
    Browser: {
      openStyle: 'normal', // Открывать в обычном браузере, не in-app
    },
  },
};

export default config;
