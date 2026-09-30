import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-[680px] overflow-hidden bg-gray-100" aria-labelledby="hero-heading">
      <img
        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-end px-5 pb-16 lg:px-8 lg:pb-24">
        <div className="max-w-xl text-white animate-slide-up">

          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]">
            New Collection
          </p>

          <h1 id="hero-heading" className="text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Style that
            <br />
            speaks for you.
          </h1>

          <p className="mt-6 max-w-md text-sm leading-6 text-white/85 sm:text-base">
            Discover carefully selected fashion pieces designed to bring
            confidence, comfort, and personality into your everyday style.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-3 bg-white px-7 py-4 text-sm font-semibold text-black transition-colors hover:bg-gray-200"
            >
              Shop New Arrivals
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-3 border border-white/30 px-7 py-4 text-sm font-medium text-white transition-colors hover:bg-white hover:text-black"
            >
              Explore Collection
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}