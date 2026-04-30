import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.shop.vteen.app',
  appName: 'VTeen',
  webDir: 'dist',
  server: {
    // Để trống url để chạy app React local. 
    // Nếu muốn load thẳng website thì điền: 'https://vteen.shop'
    cleartext: false
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#050510'
  }
};

export default config;
