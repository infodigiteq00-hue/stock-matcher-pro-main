const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const resolveApiBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envBaseUrl) {
    return normalizeBaseUrl(envBaseUrl);
  }

  // Keep relative API paths as a safe fallback for local proxy/electron.
  return "";
};

const API_BASE_URL = resolveApiBaseUrl();

export const toApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
