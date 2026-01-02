import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">AI Bookmark</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Save any webpage and find it later with semantic search. No more
          forgotten bookmarks.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
