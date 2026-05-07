import React from 'react';

export const ReportSkeleton: React.FC = () => {
  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24">
      {/* Top Navigation Skeleton */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f7f9fb] flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-container-highest rounded-full animate-pulse"></div>
          <div className="w-24 h-6 bg-surface-container-highest rounded animate-pulse"></div>
        </div>
        <div className="w-8 h-8 bg-surface-container-highest rounded-full animate-pulse"></div>
      </header>

      <main className="pt-14 pb-28 px-6 max-w-md mx-auto">
        {/* Segmented Control Skeleton */}
        <div className="pt-4">
          <div className="bg-surface-container-low p-1 flex rounded-lg">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-8 bg-surface-container-highest rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Hero Card Skeleton */}
        <section className="relative mt-6">
          <div className="w-32 h-4 bg-surface-container-highest rounded animate-pulse mb-4"></div>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 h-8 bg-surface-container-highest rounded-md animate-pulse"></div>
            ))}
          </div>
          <div className="flex items-baseline gap-4">
            <div className="w-12 h-12 bg-surface-container-highest rounded-full animate-pulse"></div>
            <div className="w-32 h-16 bg-surface-container-highest rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-5 h-5 bg-surface-container-highest rounded animate-pulse"></div>
            <div className="w-32 h-4 bg-surface-container-highest rounded animate-pulse"></div>
          </div>
        </section>

        {/* Chart Skeleton */}
        <section className="space-y-4 mt-8">
          <div className="w-32 h-5 bg-surface-container-highest rounded animate-pulse"></div>
          <div className="bg-surface-container-lowest p-6 rounded-xl">
            <div className="flex items-end justify-between h-40 px-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-2 bg-surface-container-highest rounded-full animate-pulse" style={{height: `${Math.random() * 100 + 20}px`}}></div>
                  <div className="w-3 h-3 bg-surface-container-highest rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Insights Skeleton */}
        <section className="mt-8">
          <div className="p-5 bg-surface-container-low rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-surface-container-highest rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="w-16 h-3 bg-surface-container-highest rounded animate-pulse mb-2"></div>
              <div className="w-48 h-4 bg-surface-container-highest rounded animate-pulse"></div>
            </div>
            <div className="w-5 h-5 bg-surface-container-highest rounded animate-pulse"></div>
          </div>
        </section>

        {/* Categories Skeleton */}
        <section className="bg-surface-container-lowest rounded-xl overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-surface-container-low flex justify-between items-center">
            <div className="w-40 h-5 bg-surface-container-highest rounded animate-pulse"></div>
            <div className="w-5 h-5 bg-surface-container-highest rounded animate-pulse"></div>
          </div>
          <div className="divide-y divide-surface-container-low">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-6 flex items-center">
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg mr-4 animate-pulse"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="w-16 h-4 bg-surface-container-highest rounded animate-pulse"></div>
                    <div className="w-20 h-4 bg-surface-container-highest rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-surface-container-high rounded-full animate-pulse" style={{width: `${Math.random() * 80 + 20}%`}}></div>
                    </div>
                    <div className="w-8 h-3 bg-surface-container-highest rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation Skeleton */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 py-3 pb-safe bg-[#f2f4f6] border-t border-outline-variant/10">
        <div className="flex flex-col items-center justify-center">
          <div className="w-6 h-6 bg-surface-container-highest rounded animate-pulse"></div>
          <div className="w-8 h-3 bg-surface-container-highest rounded animate-pulse mt-1"></div>
        </div>
        <div className="relative -top-6">
          <div className="w-16 h-16 bg-surface-container-highest rounded-full animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="w-6 h-6 bg-surface-container-highest rounded animate-pulse"></div>
          <div className="w-8 h-3 bg-surface-container-highest rounded animate-pulse mt-1"></div>
        </div>
      </nav>
    </div>
  );
};
