export default function SkeletonCard({ darkMode }) {
  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const skeleton = darkMode ? 'bg-gray-700' : 'bg-gray-200'

  return (
    <div className={`${card} rounded-lg overflow-hidden border border-transparent`}>
      <div className="flex">
        {/* Poster skeleton */}
        <div className={`w-20 h-28 ${skeleton} animate-skeleton flex-shrink-0`} />

        <div className="p-2 flex-1 space-y-2">
          {/* Title skeleton */}
          <div className={`h-4 ${skeleton} animate-skeleton rounded w-3/4`} />

          {/* Director/Year skeleton */}
          <div className={`h-3 ${skeleton} animate-skeleton rounded w-1/2`} />

          {/* Tags skeleton */}
          <div className="flex gap-1">
            <div className={`h-5 w-16 ${skeleton} animate-skeleton rounded`} />
            <div className={`h-5 w-14 ${skeleton} animate-skeleton rounded`} />
          </div>

          {/* Rating skeleton */}
          <div className={`h-3 ${skeleton} animate-skeleton rounded w-20`} />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between p-2 pt-1">
        <div className={`h-3 w-12 ${skeleton} animate-skeleton rounded`} />
        <div className={`h-6 w-20 ${skeleton} animate-skeleton rounded`} />
      </div>
    </div>
  )
}
