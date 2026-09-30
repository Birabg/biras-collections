import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Category discovery — three large editorial cards.
 * The whole card is one link; hover is a gentle image zoom plus a small arrow
 * nudge, nothing more.
 */
const CARDS = [
  {
    name: 'Women',
    to: '/shop?category=women',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85',
    alt: 'Woman wearing a flowing contemporary dress',
    count: '42 pieces',
  },
  {
    name: 'Men',
    to: '/shop?category=men',
    image:
      'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=1000&q=85',
    alt: 'Man wearing a tailored shirt and trousers',
    count: '38 pieces',
  },
  {
    name: 'Accessories',
    to: '/shop?category=accessories',
    image:
      'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1000&q=85',
    alt: 'Leather belt and accessories arranged on a neutral surface',
    count: '26 pieces',
  },
];

export default function CategorySection() {
  return (
    <section className="shell section-y" aria-labelledby="categories-heading">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="t-eyebrow text-ink-40">Shop by category</p>
          <h2 id="categories-heading" className="t-section mt-3">
            Find your department
          </h2>
        </div>

        <Link
          to="/shop"
          className="link-underline inline-flex items-center gap-2 self-start text-[0.8125rem] font-medium text-ink transition-colors sm:self-auto"
        >
          View everything
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        </Link>
      </header>

      <ul className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6 lg:mt-14">
        {CARDS.map((card) => (
          <li key={card.name}>
            <Link
              to={card.to}
              className="group relative block overflow-hidden bg-sand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              {/* Mobile: 4:5. Desktop: taller editorial portrait. */}
              <div className="aspect-[4/5] w-full overflow-hidden md:aspect-[3/4] lg:aspect-[2/3]">
                <img
                  src={card.image}
                  alt={card.alt}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                />
              </div>

              <div
                className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/5 to-transparent transition-opacity duration-500 group-hover:from-ink/70"
                aria-hidden="true"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 lg:p-7">
                <div>
                  <h3 className="font-display text-2xl leading-tight text-paper lg:text-3xl">
                    {card.name}
                  </h3>
                  <p className="t-eyebrow mt-2 text-[0.625rem] text-paper/70">{card.count}</p>
                </div>

                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border border-paper/40 text-paper transition-[transform,background-color,color] duration-300 group-hover:translate-x-1 group-hover:bg-paper group-hover:text-ink"
                  aria-hidden="true"
                >
                  <ArrowRight size={16} strokeWidth={1.75} />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
