import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-9' };
  return (
    <Loader2
      size={16}
      strokeWidth={1.75}
      className={`animate-spin text-ink ${sizes[size] ?? sizes.md} ${className}`}
      aria-hidden="true"
    />
  );
}

/** Generic shimmer block. Mirrors the shape of the content it stands in for. */
export function LoadingSkeleton({ className = '', variant = 'text', width, height }) {
  const variants = {
    text: 'h-3.5',
    title: 'h-6',
    card: 'h-full',
    image: 'aspect-[3/4]',
    button: 'h-12',
  };

  return (
    <div
      className={`skeleton ${variants[variant] ?? variants.text} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <LoadingSkeleton variant="image" className="w-full" />
      <div className="flex flex-col gap-2.5">
        <LoadingSkeleton variant="text" width="56px" />
        <LoadingSkeleton variant="text" width="78%" />
        <LoadingSkeleton variant="text" width="42px" />
      </div>
    </div>
  );
}

/** Grid columns mirror ProductGrid: 2 on mobile, 3 tablet, 4 desktop. */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Announced to assistive tech while a page region is loading. */
export function LoadingRegion({ label = 'Loading', children, className = '' }) {
  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <LoadingRegion label="Loading page">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <LoadingSkeleton variant="text" width="120px" />
          <LoadingSkeleton variant="title" width="260px" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </LoadingRegion>
  );
}
