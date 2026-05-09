import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.shop.vteen.app',
  appName: 'VTeen',
  webDir: 'dist',
  server: {
    cleartext: false,
    allowNavigation: [
      'vteen.shop',
      '*.vteen.shop',
      'clbphimxua.com',
      '*.clbphimxua.com',
      'abysscdn.com',
      '*.abysscdn.com',
      'vip.opstream17.com',
      '*.opstream17.com',
      'cdn.plyr.io',
      'cdn.jsdelivr.net'
    ]
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#050510',
    allowsInlineMediaPlayback: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
