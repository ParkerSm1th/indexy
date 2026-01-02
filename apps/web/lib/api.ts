import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL || "http://localhost:3001";

async function getAuthToken() {
  const { getToken } = await auth();
  return getToken();
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

// Bookmark types
export interface Bookmark {
  id: string;
  userId: string;
  url: string;
  title: string;
  markdown: string;
  favicon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkListResponse {
  success: boolean;
  data: {
    bookmarks: Bookmark[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface SearchResultItem {
  bookmark: Bookmark;
  matchedChunk: string;
  similarity: number;
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResultItem[];
    query: string;
    totalResults: number;
  };
}

// API functions
export async function getBookmarks(page = 1, pageSize = 20) {
  return apiClient<BookmarkListResponse>(
    `/api/bookmarks?page=${page}&pageSize=${pageSize}`
  );
}

export async function getBookmark(id: string) {
  return apiClient<{ success: boolean; data: Bookmark }>(`/api/bookmarks/${id}`);
}

export async function deleteBookmark(id: string) {
  return apiClient<{ success: boolean }>(`/api/bookmarks/${id}`, {
    method: "DELETE",
  });
}

export async function searchBookmarks(query: string, limit = 10) {
  return apiClient<SearchResponse>("/api/search", {
    method: "POST",
    body: JSON.stringify({ query, limit }),
  });
}
