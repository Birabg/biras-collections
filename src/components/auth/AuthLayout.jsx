import { Link } from 'react-router-dom';

/**
 * AuthLayout — shared frame for sign in, register, forgot and reset.
 * Editorial image on the left on desktop, single column on mobile.
 */
export default function AuthLayout({ title, subtitle, children, footer, aside }) {
  return (
    <div className="grid min-h-[calc(100dvh-var(--header-height,5rem))] lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col justify-center px-5 py-14 sm:px-10 lg:px-16 lg:py-20">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="t-eyebrow inline-block text-ink-40 transition-colors hover:text-ink"
          >
            Bira&rsquo;s Collections
          </Link>

          <h1 className="t-page mt-6">{title}</h1>

          {subtitle && <p className="t-body mt-3 max-w-sm">{subtitle}</p>}

          <div className="mt-10">{children}</div>

          {footer && <div className="mt-10 border-t border-line pt-8">{footer}</div>}
        </div>
      </div>

      {/* Editorial side */}
      <aside className="relative hidden overflow-hidden bg-sand lg:block">
        <img
          src={aside?.image}
          alt=""
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-transparent"
          aria-hidden="true"
        />
        {aside?.quote && (
          <figure className="absolute inset-x-0 bottom-0 p-12">
            <blockquote className="font-display text-3xl leading-[1.2] text-paper">
              {aside.quote}
            </blockquote>
            {aside.caption && (
              <figcaption className="t-eyebrow mt-5 text-paper/60">{aside.caption}</figcaption>
            )}
          </figure>
        )}
      </aside>
    </div>
  );
}
