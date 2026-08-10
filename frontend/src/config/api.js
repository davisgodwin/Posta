export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/posta/backend';

// Helper to handle avatar & media paths consistently across local & production
export const getAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
};