"use client";

import { useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { useBookmarks, useSearch, type Bookmark, type SearchResultItem } from "@/lib/hooks";
import { BookmarkCard } from "@/components/BookmarkCard";

export default function DashboardPage() {
  const { bookmarks, total, isLoading, deleteBookmark, revalidate } = useBookmarks();
  const { query, setQuery, results, isSearching, hasQuery } = useSearch();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = useCallback(
    async (id: string) => {
      if (deletingIds.has(id)) return;

      setDeletingIds((prev) => new Set(prev).add(id));

      try {
        await deleteBookmark(id);
      } catch (error) {
        console.error("Failed to delete:", error);
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [deleteBookmark, deletingIds]
  );

  // Show search results or bookmarks
  const showingSearch = hasQuery;
  const displayItems = showingSearch ? results : bookmarks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookmarks</h1>
          <p className="text-sm text-muted-foreground">
            {hasQuery ? (
              isSearching ? (
                "Searching..."
              ) : (
                `${results.length} result${results.length !== 1 ? "s" : ""}`
              )
            ) : (
              `${total} saved`
            )}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your bookmarks..."
          className="w-full pl-10 pr-10 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          autoFocus
        />
        {(isSearching || isLoading) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {(isLoading && !hasQuery) || (isSearching && hasQuery) ? (
          // Loading skeletons - show when loading bookmarks or searching
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border border-border rounded-lg p-4 animate-pulse bg-card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <div className="w-24 h-4 bg-muted rounded" />
                </div>
                <div className="w-3/4 h-5 bg-muted rounded mb-2" />
                <div className="w-full h-4 bg-muted rounded" />
              </div>
            ))}
          </>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            {hasQuery ? (
              <>
                <p className="text-muted-foreground">No results found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try different keywords
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">No bookmarks yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the browser extension to save pages
                </p>
              </>
            )}
          </div>
        ) : (
          displayItems.map((item) => {
            const bookmark = showingSearch
              ? (item as SearchResultItem).bookmark
              : (item as Bookmark);
            const similarity = showingSearch
              ? (item as SearchResultItem).similarity
              : undefined;
            const matchedChunk = showingSearch
              ? (item as SearchResultItem).matchedChunk
              : undefined;

            return (
              <div
                key={bookmark.id}
                className={`transition-all duration-200 ${
                  deletingIds.has(bookmark.id)
                    ? "opacity-50 scale-98 pointer-events-none"
                    : ""
                }`}
              >
                <BookmarkCard
                  bookmark={bookmark}
                  onDelete={handleDelete}
                  similarity={similarity}
                  matchedChunk={matchedChunk}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
