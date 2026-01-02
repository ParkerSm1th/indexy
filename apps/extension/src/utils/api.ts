import { getAuthToken, getApiUrl } from "./storage";

interface BookmarkPayload {
  url: string;
  title: string;
  markdown: string;
  favicon?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function saveBookmark(
  payload: BookmarkPayload
): Promise<ApiResponse<{ id: string }>> {
  const token = await getAuthToken();
  const apiUrl = await getApiUrl();

  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const response = await fetch(`${apiUrl}/api/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Return specific error for auth failures
      if (response.status === 401) {
        return { success: false, error: "Unauthorized - token expired or invalid" };
      }
      return { success: false, error: data.error || "Failed to save bookmark" };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error("Failed to save bookmark:", error);
    return { success: false, error: "Network error" };
  }
}

export async function checkAuth(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}
