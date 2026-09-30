import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Shop the collection', to: '/shop' },
  { label: 'Shipping and delivery', to: '/shipping' },
  { label: 'Returns and exchanges', to: '/returns' },
  { label: 'Contact support', to: '/contact' },
];

export default function NotFound() {
  return (
    <div className="shell section-y flex flex-col items-center text-center">
      <p className="t-display !text-[5rem] leading-none text-ink-25 sm:!text-[7rem]">404</p>

      <h1 className="t-page mt-6">This page has moved on</h1>

      <p className="t-body mt-4 max-w-md text-[0.9375rem]">
        The link you followed does not lead anywhere on this site. It may have been renamed, or the
        address may have a typo in it.
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center gap-2 border border-ink bg-ink px-6 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ink-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-ink"
        >
          Back to homepage
        </Link>
        <Link
          to="/shop"
          className="group inline-flex h-11 items-center justify-center gap-2 border border-ink px-6 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-sand focus:outline-none focus-visible:ring-1 focus-visible:ring-ink"
        >
          Browse the collection
          <ArrowRight
            size={14}
            strokeWidth={1.8}
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      <div className="mt-12 w-full max-w-sm border-t border-line pt-8">
        <h2 className="t-eyebrow text-ink-40">Or try one of these</h2>
        <ul className="mt-4 flex flex-col gap-2.5">
          {SUGGESTIONS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="text-[0.875rem] text-ink-60 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
