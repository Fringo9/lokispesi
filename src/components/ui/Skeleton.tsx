interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-border/50 rounded-lg ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border space-y-4">
      <Skeleton className="h-3 w-32" />
      <div className="flex justify-center">
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border space-y-4">
      <Skeleton className="h-3 w-28" />
      <div className="flex items-end gap-3 h-40 px-4">
        {[60, 45, 80, 55, 70, 90].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-primary/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <Skeleton className="h-5 w-32" />
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        <CardSkeleton />
        <ChartSkeleton />
        <ListSkeleton rows={4} />
      </div>
    </div>
  )
}
