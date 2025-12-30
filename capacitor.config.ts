import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dronegarden.app',
  appName: 'Drone Service',
  webDir: 'dist',
  server: {
    // Allow loading external URLs
    allowNavigation: ['cieniowanie.droneagri.pl', '*.droneagri.pl']
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false
  }
};

export default config;
