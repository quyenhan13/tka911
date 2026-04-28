// Capacitor iOS cũng chạy trên hostname "localhost"; chỉ coi là dev khi chạy Vite.
const isDev = window.location.protocol.startsWith('http') && window.location.port === '5173';

export const CONFIG = {
  // Nếu là Dev thì dùng đường dẫn tương đối để đi qua Proxy, nếu không thì dùng link thật
  API_BASE_URL: isDev ? '/api' : 'https://vteen.io.vn/api',
  SITE_BASE_URL: isDev ? '' : 'https://vteen.io.vn',
  ADMIN_BASE_URL: isDev ? '/vteen-admin' : 'https://vteen.io.vn/admin',
  APP_NAME: 'VTeen',
  VERSION: '1.0.0'
};
