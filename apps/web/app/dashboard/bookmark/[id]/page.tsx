"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useBookmark } from "@/lib/hooks";
import ReactMarkdown from "react-markdown";
import { use } from "react";

interface BookmarkPageProps {
  params: Promise<{ id: string }>;
}

export default function BookmarkPage({ params }: BookmarkPageProps) {
  const { id } = use(params);
  const { bookmark, isLoading, error } = useBookmark(id);

  if (error) {
    console.error("Failed to fetch bookmark:", error);
    notFound();
  }

  if (isLoading || !bookmark) {
    // Show loading skeleton while fetching
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-6" />
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="w-32 h-4 bg-muted rounded" />
            <div className="w-2 h-4 bg-muted rounded" />
            <div className="w-24 h-4 bg-muted rounded" />
          </div>
          <div className="w-3/4 h-9 bg-muted rounded mb-4" />
          <div className="w-40 h-5 bg-muted rounded" />
        </div>
        <div className="space-y-4">
          <div className="w-full h-4 bg-muted rounded" />
          <div className="w-full h-4 bg-muted rounded" />
          <div className="w-5/6 h-4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const domain = new URL(bookmark.url).hostname;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to bookmarks
      </Link>

      <article>
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            {bookmark.favicon && (
              <img
                src={bookmark.favicon}
                alt=""
                className="w-4 h-4"
              />
            )}
            <span>{domain}</span>
            <span>•</span>
            <span>
              Saved {new Date(bookmark.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-4">{bookmark.title}</h1>

          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            View original page
            <ExternalLink className="w-4 h-4" />
          </a>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown>{bookmark.markdown}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
