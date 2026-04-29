const DEFAULT_RENDER_API_BASE = "https://stock-matcher-pro-main.onrender.com";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const resolveApiBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envBaseUrl) {
    return normalizeBaseUrl(envBaseUrl);
  }

  return DEFAULT_RENDER_API_BASE;
};

const API_BASE_URL = resolveApiBaseUrl();

export const toApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
