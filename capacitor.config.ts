import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.io.vteen.app',
  appName: 'VTeen',
  webDir: 'dist',
  server: {
    // Để trống url để chạy app React local. 
    // Nếu muốn load thẳng website thì điền: 'https://vteen.io.vn'
    cleartext: false
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
