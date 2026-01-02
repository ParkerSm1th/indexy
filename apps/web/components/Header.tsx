"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Bookmark, Settings } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bookmark className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg group-hover:text-primary transition-colors">
            AI Bookmark
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className={`text-sm transition-colors ${
              pathname === "/dashboard"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bookmarks
          </Link>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
