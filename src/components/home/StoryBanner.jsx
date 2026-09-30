import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Editorial story panel — split image/copy, generous whitespace.
 * Deliberately not a "card": no border, no radius, no shadow.
 */
export default function StoryBanner() {
  return (
    <section className="border-t border-line" aria-labelledby="story-heading">
      <div className="mx-auto grid max-w-[90rem] items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-20 lg:px-12 lg:py-28">
        <div className="relative order-2 lg:order-1">
          <div className="aspect-[4/5] overflow-hidden bg-sand lg:aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=85"
              alt="Garments on rails in a bright studio"
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
        </div>

        <div className="order-1 max-w-lg lg:order-2">
          <p className="t-eyebrow text-ink-40">Our approach</p>

          <h2 id="story-heading" className="t-section mt-4">
            Made in small runs, built to be worn often
          </h2>

          <div className="mt-6 flex flex-col gap-4">
            <p className="t-body">
              We produce in limited quantities and restock only what sells. That keeps quality high
              and waste low, and it means the piece you love is more likely to still be here.
            </p>
            <p className="t-body">
              Materials are chosen for how they age — linen that softens, leather that patinas,
              cotton that holds its shape. Nothing is designed for a single season of attention.
            </p>
          </div>

          <Link
            to="/about"
            className="link-underline mt-8 inline-flex items-center gap-2 text-[0.8125rem] font-medium text-ink"
          >
            Read our story
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
