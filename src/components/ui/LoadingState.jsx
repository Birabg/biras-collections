export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  return (
    <svg className={`animate-spin text-black ${sizes[size]} ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function LoadingSkeleton({ className = '', variant = 'text', width, height }) {
  const base = 'animate-pulse bg-gray-200 rounded';
  const variants = {
    text: 'h-4',
    avatar: 'rounded-full',
    card: 'rounded-lg',
    image: 'aspect-[3/4] rounded-lg',
    button: 'h-11 rounded-md',
  };
  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <article className="group">
      <LoadingSkeleton variant="image" className="aspect-[3/4]" />
      <div className="pt-4 space-y-3">
        <LoadingSkeleton variant="text" width="60px" />
        <LoadingSkeleton variant="text" width="120px" />
        <LoadingSkeleton variant="text" width="80px" />
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse max-w-xs" />
      <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse max-w-md" />
      <ProductGridSkeleton count={4} />
    </div>
  );
}