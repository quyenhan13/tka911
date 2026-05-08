// Capacitor iOS also runs on localhost; only Vite uses port 5173.
const isViteDev = window.location.protocol.startsWith('http') && window.location.port === '5173';

export const CONFIG = {
  API_BASE_URL: 'https://vteen.shop/api',
  SITE_BASE_URL: 'https://vteen.shop',
  APP_NAME: 'VTeen',
  VERSION: '1.0.3'
};
