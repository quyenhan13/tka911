import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.shop.vteen.app',
  appName: 'VTeen',
  webDir: 'dist',
  server: {
    hostname: 'vteen.shop',
    iosScheme: 'https',
    cleartext: false
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#050510',
    allowsInlineMediaPlayback: true
  }
};

export default config;
