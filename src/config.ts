// Capacitor iOS also runs on localhost; only Vite uses port 5173.
const isViteDev = window.location.protocol.startsWith('http') && window.location.port === '5173';
const useLocalApi = isViteDev && import.meta.env.VITE_USE_LOCAL_API === '1';

export const CONFIG = {
  API_BASE_URL: useLocalApi ? '/api' : 'https://vteen.io.vn/api',
  SITE_BASE_URL: useLocalApi ? '' : 'https://vteen.io.vn',
  APP_NAME: 'VTeen',
  VERSION: '1.0.2'
};
