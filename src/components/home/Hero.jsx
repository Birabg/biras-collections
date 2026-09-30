import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85';

/**
 * Editorial hero.
 *
 * The type sits in the lower-left on a light gradient rather than a heavy
 * scrim, so the photograph stays readable as photography. Mobile uses a
 * taller, centre-weighted crop with its own solid panel behind the copy to
 * guarantee contrast.
 */
export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink" aria-labelledby="hero-heading">
      <picture>
        <img
          src={HERO_IMAGE}
          alt="Model wearing a tailored neutral-toned outfit from the new season collection"
          className="absolute inset-0 size-full object-cover object-[center_35%] lg:object-[center_28%]"
          fetchPriority="high"
          decoding="async"
        />
      </picture>

      {/* Light directional gradient — enough for contrast, not enough to flatten */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-ink/10 lg:bg-gradient-to-r lg:from-ink/65 lg:via-ink/20 lg:to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-[90rem] flex-col justify-end px-5 pb-14 pt-28 sm:pb-20 lg:min-h-[86vh] lg:px-12 lg:pb-24 lg:pt-32">
        <div className="max-w-2xl">
          <p className="t-eyebrow text-paper/70">New season · 2026</p>

          <h1 id="hero-heading" className="t-display mt-5 text-paper">
            The New Season
          </h1>

          <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-paper/85 sm:text-lg">
            Style that speaks for you. Considered pieces, made in small runs and delivered across
            Ethiopia.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/shop?new=true"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-[2px] bg-paper px-8 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:bg-paper/90"
            >
              Shop New Arrivals
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </Link>

            <Link
              to="/shop"
              className="inline-flex h-13 items-center justify-center rounded-[2px] border border-paper/40 px-8 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors duration-200 hover:border-paper hover:bg-paper/10"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
