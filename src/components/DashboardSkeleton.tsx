import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header skeleton */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-56" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Birthday countdown skeleton */}
        <Skeleton className="h-16 w-full rounded-xl" />

        {/* Summary card skeleton */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1 pr-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3.5 w-40" />
            </div>
            <div className="flex gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center space-y-1">
                  <Skeleton className="h-5 w-8 mx-auto" />
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </Card>
          <Card className="p-3 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </Card>
        </div>

        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-full rounded-lg" />

        {/* Content cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
