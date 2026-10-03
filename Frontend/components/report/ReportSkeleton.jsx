const Bar = ({ w = "w-full", h = "h-3" }) => (
  <span className={`block ${w} ${h} skeleton`} />
);

const SkeletonPanel = ({ title, children, className = "" }) => (
  <section className={`border border-edge bg-surface p-5 ${className}`}>
    {title && (
      <div className="mb-4">
        <Bar w="w-40" h="h-4" />
        <div className="mt-2">
          <Bar w="w-64" h="h-2.5" />
        </div>
      </div>
    )}
    {children}
  </section>
);

const HeatmapSkeleton = () => (
  <SkeletonPanel title>
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-12 skeleton" />
      ))}
    </div>
    <div className="mt-5 overflow-x-auto pb-1 scroll-x-smooth">
      <div className="w-full min-w-[38.75rem]">
        <div className="flex flex-col gap-[0.125rem]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="flex items-center">
              <span className="w-7 shrink-0 text-[0.5625rem] text-muted pr-1 text-right">
                {d}
              </span>
              {Array.from({ length: 53 }, (_, w) => (
                <span
                  key={w}
                  className="flex-1 min-w-0 aspect-square border border-line skeleton"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </SkeletonPanel>
);

export const ControlsSkeleton = () => (
  <section
    className="w-full max-w-6xl border border-edge bg-surface p-5"
    aria-busy="true"
    aria-label="Loading role matching controls"
  >
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0 flex-1">
        <span className="block h-4 w-44 skeleton" />
        <div className="mt-2 space-y-2 max-w-lg">
          <span className="block h-2.5 w-full skeleton" />
          <span className="block h-2.5 w-2/3 skeleton" />
        </div>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mt-4">
      <span className="h-[2.625rem] w-full sm:w-36 border border-dashed border-line skeleton" />
      <span className="h-[2.625rem] w-full sm:w-[16.25rem] skeleton" />
      <span className="h-[2.625rem] w-full sm:w-48 skeleton" />
    </div>
  </section>
);

const ReportSkeleton = () => (
  <article
    className="w-full max-w-6xl flex flex-col gap-6"
    aria-busy="true"
    aria-live="polite"
    aria-label="Loading your report"
  >
    <HeatmapSkeleton />

    <SkeletonPanel title>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-14 skeleton" />
        ))}
      </div>
      <div className="mt-5 mb-2">
        <Bar w="w-32" h="h-3.5" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 skeleton" />
        ))}
      </div>
    </SkeletonPanel>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SkeletonPanel title>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="h-7 w-20 skeleton" />
          ))}
        </div>
      </SkeletonPanel>
      <SkeletonPanel title className="lg:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-16 skeleton" />
          ))}
        </div>
      </SkeletonPanel>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }, (_, i) => (
        <SkeletonPanel key={i} title>
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, j) => (
              <div key={j} className="h-3.5 skeleton" />
            ))}
          </div>
        </SkeletonPanel>
      ))}
    </div>

    <SkeletonPanel title>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-9 skeleton" />
        ))}
      </div>
    </SkeletonPanel>
  </article>
);

export default ReportSkeleton;