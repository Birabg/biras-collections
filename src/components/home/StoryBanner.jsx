import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function StoryBanner() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8" aria-labelledby="story-heading">
      <div className="grid overflow-hidden bg-[#111111] md:grid-cols-2">
        <div className="flex min-h-[450px] flex-col justify-center px-8 py-14 text-white sm:px-12 lg:px-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            Our philosophy
          </p>

          <h2 id="story-heading" className="mt-5 text-4xl font-medium leading-tight">
            Fashion should feel like you.
          </h2>

          <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
            Bira's Collections brings together timeless essentials and
            modern pieces that make everyday dressing simple, confident,
            and personal.
          </p>

          <Link
            to="/shop"
            className="mt-8 inline-flex w-fit items-center gap-3 border border-white/30 px-6 py-3 text-sm font-medium transition-colors hover:bg-white hover:text-black"
          >
            Discover our collection
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="min-h-[450px] relative">
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85"
            alt="Fashion collection showcasing our philosophy"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}