import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pl.droneagri.app',
  appName: 'Panel Agricultura',
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
