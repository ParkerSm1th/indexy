const STORAGE_KEYS = {
  AUTH_TOKEN: "ai_bookmark_auth_token",
  API_URL: "ai_bookmark_api_url",
  WEB_APP_URL: "ai_bookmark_web_app_url",
} as const;

export async function getAuthToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
  return result[STORAGE_KEYS.AUTH_TOKEN] || null;
}

export async function setAuthToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.AUTH_TOKEN]: token });
}

export async function clearAuthToken(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.AUTH_TOKEN);
}

export async function getApiUrl(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_URL);
  return result[STORAGE_KEYS.API_URL] || "http://localhost:3001";
}

export async function setApiUrl(url: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.API_URL]: url });
}

export async function getWebAppUrl(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.WEB_APP_URL);
  return result[STORAGE_KEYS.WEB_APP_URL] || "http://localhost:3000";
}

export async function setWebAppUrl(url: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.WEB_APP_URL]: url });
}
