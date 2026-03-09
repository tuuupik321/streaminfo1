export function AppShellSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:p-4 md:p-8">
      <div className="mb-6 h-8 w-64 rounded bg-muted/60 shimmer" />
      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="linear-card p-3 sm:p-6">
            <div className="mb-3 h-3 w-24 rounded bg-muted/70 shimmer" />
            <div className="h-8 w-20 rounded bg-muted/70 shimmer" />
          </div>
        ))}
      </div>
      <div className="linear-card mb-8 p-6">
        <div className="mb-4 h-4 w-36 rounded bg-muted/70 shimmer" />
        <div className="h-64 rounded bg-muted/60 shimmer" />
      </div>
      <div className="linear-card h-44 rounded-[6px] bg-black shimmer" />
    </div>
  );
}
