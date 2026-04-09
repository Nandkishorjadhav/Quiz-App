// Backend API URL Configuration
// Priority:
// 1) VITE_API_URL (explicit backend URL)
// 2) local dev fallback (localhost:5000)
// 3) production same-origin (useful when API is reverse-proxied)

const ENV_API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_BASE_URL = ENV_API_URL
  ? ENV_API_URL.replace(/\/$/, '')
  : import.meta.env.DEV
    ? 'http://localhost:5000'
    : window.location.origin;

export default API_BASE_URL;
