"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export interface SearchResultItem {
  bookmark: Bookmark;
  matchedChunk: string;
  similarity: number;
}

// Hook for fetching bookmarks with caching
export function useBookmarks() {
  const { getToken } = useAuth();

  const fetcher = useCallback(
    async (url: string) => {
      const token = await getToken();
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("API request failed");
      return res.json();
    },
    [getToken]
  );

  const { data, error, isLoading, mutate } = useSWR(
    `${API_URL}/api/bookmarks?page=1&pageSize=100`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      // Optimistic update - remove immediately from UI
      const optimisticData = {
        ...data,
        data: {
          ...data?.data,
          bookmarks: data?.data?.bookmarks?.filter((b: Bookmark) => b.id !== id) || [],
          total: (data?.data?.total || 1) - 1,
        },
      };

      // Update local state immediately
      mutate(optimisticData, false);

      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/bookmarks/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Delete failed");

        // Revalidate to confirm
        mutate();
      } catch (error) {
        // Revert on error
        mutate();
        throw error;
      }
    },
    [data, mutate, getToken]
  );

  return {
    bookmarks: (data?.data?.bookmarks || []) as Bookmark[],
    total: data?.data?.total || 0,
    isLoading,
    error,
    deleteBookmark,
    revalidate: mutate,
  };
}

// Hook for search with debouncing and URL sync
export function useSearch() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Get initial query from URL
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUpdatingUrlRef = useRef(false);
  const lastUrlQueryRef = useRef(urlQuery);

  // Sync URL query to state only when URL changes externally (browser nav)
  useEffect(() => {
    if (urlQuery !== lastUrlQueryRef.current && !isUpdatingUrlRef.current) {
      lastUrlQueryRef.current = urlQuery;
      setQuery(urlQuery);
      setDebouncedQuery(urlQuery);
    }
  }, [urlQuery]);

  // Update URL when query changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      
      // Only update URL if it's different from current
      const currentUrlQuery = searchParams.get("q") || "";
      const trimmedQuery = query.trim();
      
      if (trimmedQuery !== currentUrlQuery) {
        isUpdatingUrlRef.current = true;
        lastUrlQueryRef.current = trimmedQuery;
        
        const params = new URLSearchParams();
        if (trimmedQuery) {
          params.set("q", trimmedQuery);
        }
        
        const newUrl = params.toString() 
          ? `${pathname}?${params.toString()}`
          : pathname;
        
        // Use replace to avoid adding to history for each keystroke
        router.replace(newUrl, { scroll: false });
        
        // Reset flag after a brief delay to allow URL to update
        setTimeout(() => {
          isUpdatingUrlRef.current = false;
        }, 100);
      }
    }, 300); // Increased debounce to 300ms for better performance

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const search = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsSearching(true);

      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: debouncedQuery, limit: 20 }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();
        setResults(data.data?.results || []);
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Search error:", error);
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedQuery, getToken]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    hasQuery: debouncedQuery.trim().length > 0,
  };
}

// Hook for fetching a single bookmark with caching
export function useBookmark(id: string) {
  const { getToken } = useAuth();

  const fetcher = useCallback(
    async (url: string) => {
      const token = await getToken();
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("API request failed");
      return res.json();
    },
    [getToken]
  );

  const { data, error, isLoading, mutate } = useSWR(
    id ? `${API_URL}/api/bookmarks/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
      keepPreviousData: true,
    }
  );

  return {
    bookmark: data?.data as Bookmark | undefined,
    isLoading,
    error,
    revalidate: mutate,
  };
}
