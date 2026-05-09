// Capacitor iOS also runs on localhost; only Vite uses port 5173.

export const CONFIG = {
  // Gọi thẳng tới server chính để App hoạt động độc lập khi tắt máy tính
  API_BASE_URL: import.meta.env.DEV ? '/api' : 'https://vteen.shop/api',
  SITE_BASE_URL: import.meta.env.DEV ? '/__vteen' : 'https://vteen.shop',
  APP_NAME: 'VTeen',
  VERSION: '1.0.3'
};
