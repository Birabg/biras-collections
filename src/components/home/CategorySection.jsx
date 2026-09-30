import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const categories = [
  {
    name: 'Women',
    href: '/shop?category=women',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Men',
    href: '/shop?category=men',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Accessories',
    href: '/shop?category=accessories',
    image: 'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=900&q=80',
  },
];

export default function CategorySection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8" aria-labelledby="categories-heading">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Explore
          </p>
          <h2 id="categories-heading" className="mt-2 text-3xl font-medium tracking-tight">
            Shop by category
          </h2>
        </div>

        <Link
          to="/shop"
          className="hidden items-center gap-2 text-sm font-medium sm:flex"
        >
          View all
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.name}
            to={category.href}
            className="group relative h-[430px] overflow-hidden bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            aria-label={`Shop ${category.name}`}
          >
            <img
              src={category.image}
              alt=""
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              aria-hidden="true"
            />

            <div className="absolute inset-0 bg-black/15 transition group-hover:bg-black/30" aria-hidden="true" />

            <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
              <h3 className="text-2xl font-medium">{category.name}</h3>
              <span className="mt-2 inline-flex items-center gap-2 text-sm">
                Shop now
                <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}