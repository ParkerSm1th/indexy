export default function BookmarkLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Back button skeleton */}
      <div className="h-6 w-32 bg-muted rounded mb-6" />

      {/* Header skeleton */}
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

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="w-full h-4 bg-muted rounded" />
        <div className="w-full h-4 bg-muted rounded" />
        <div className="w-5/6 h-4 bg-muted rounded" />
        <div className="w-full h-4 bg-muted rounded" />
        <div className="w-4/5 h-4 bg-muted rounded" />
        <div className="w-full h-4 bg-muted rounded" />
        <div className="w-3/4 h-4 bg-muted rounded" />
      </div>
    </div>
  );
}

