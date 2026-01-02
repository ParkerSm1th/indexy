"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2, Clock } from "lucide-react";
import { useState } from "react";

interface Bookmark {
  id: string;
  url: string;
  title: string;
  markdown: string;
  favicon: string | null;
  createdAt: string;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: (id: string) => void;
  matchedChunk?: string;
  similarity?: number;
}

export function BookmarkCard({
  bookmark,
  onDelete,
  matchedChunk,
  similarity,
}: BookmarkCardProps) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const preview = matchedChunk || bookmark.markdown.slice(0, 200).trim();
  
  const bookmarkUrl = `/dashboard/bookmark/${bookmark.id}`;
  
  // Prefetch on hover for instant navigation
  const handleMouseEnter = () => {
    router.prefetch(bookmarkUrl);
  };

  let domain = "";
  try {
    domain = new URL(bookmark.url).hostname.replace("www.", "");
  } catch {
    domain = bookmark.url;
  }

  const timeAgo = getTimeAgo(new Date(bookmark.createdAt));

  return (
    <div 
      className="group border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 bg-card"
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Domain & Similarity */}
          <div className="flex items-center gap-2 mb-1.5">
            {bookmark.favicon && !imageError ? (
              <img
                src={bookmark.favicon}
                alt=""
                className="w-4 h-4 rounded-sm"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-4 h-4 rounded-sm bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                {domain.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-muted-foreground truncate">
              {domain}
            </span>
            {similarity !== undefined && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {Math.round(similarity * 100)}%
              </span>
            )}
          </div>

          {/* Title */}
          <Link
            href={bookmarkUrl}
            prefetch={true}
            className="text-base font-medium hover:text-primary transition-colors line-clamp-1 block"
          >
            {bookmark.title}
          </Link>

          {/* Preview */}
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {preview}
            {preview.length >= 200 && "..."}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            title="Open original"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(bookmark.id);
              }}
              className="p-2 hover:bg-red-50 rounded-md transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
