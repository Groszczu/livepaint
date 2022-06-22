export const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
const protocol = import.meta.env.DEV ? 'http' : 'https';
export const API_HTTP_URL = `${protocol}://${API_DOMAIN}`;
export const API_WS_URL = `ws://${API_DOMAIN}/ws`;
