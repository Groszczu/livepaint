export const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

const httpProtocol = import.meta.env.DEV ? 'http' : 'https';
export const API_HTTP_URL = `${httpProtocol}://${API_DOMAIN}`;

const wsProtocol = import.meta.env.DEV ? 'ws' : 'wss';
export const API_WS_URL = `${wsProtocol}://${API_DOMAIN}/ws`;
