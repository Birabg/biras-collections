import {
  ArrowRight,
  Heart,
  Search,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const categories = [
  {
    name: "Women",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Men",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=900&q=80",
  },
];

const products = [
  {
    id: 1,
    name: "Classic Linen Shirt",
    category: "Men",
    price: 1850,
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "Elegant Summer Dress",
    category: "Women",
    price: 2950,
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Premium Leather Bag",
    category: "Accessories",
    price: 2400,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "Modern Casual Jacket",
    category: "Men",
    price: 3250,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
  },
];

function Home() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Announcement Bar */}
      <div className="bg-black px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white">
        FREE DELIVERY ON ORDERS OVER 5,000 ETB
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

          {/* Logo */}
          <a href="/" className="text-xl font-semibold tracking-tight">
            Bira's <span className="font-normal">Collections</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <a href="/" className="text-sm font-medium hover:text-gray-500">
              Home
            </a>

            <a href="/shop" className="text-sm font-medium hover:text-gray-500">
              Women
            </a>

            <a href="/shop" className="text-sm font-medium hover:text-gray-500">
              Men
            </a>

            <a href="/shop" className="text-sm font-medium hover:text-gray-500">
              Accessories
            </a>

            <a href="/shop" className="text-sm font-medium hover:text-gray-500">
              New Arrivals
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">

            <button
              className="hidden sm:block"
              aria-label="Search"
            >
              <Search size={20} strokeWidth={1.7} />
            </button>

            <button
              className="hidden sm:block"
              aria-label="Wishlist"
            >
              <Heart size={20} strokeWidth={1.7} />
            </button>

            <button aria-label="Shopping bag">
              <ShoppingBag size={20} strokeWidth={1.7} />
            </button>

            <button
              className="md:hidden"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Menu"
            >
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenu && (
          <div className="border-t border-gray-100 bg-white px-5 py-5 md:hidden">
            <nav className="flex flex-col gap-5">
              <a href="/" className="text-sm font-medium">
                Home
              </a>

              <a href="/shop" className="text-sm font-medium">
                Women
              </a>

              <a href="/shop" className="text-sm font-medium">
                Men
              </a>

              <a href="/shop" className="text-sm font-medium">
                Accessories
              </a>

              <a href="/shop" className="text-sm font-medium">
                New Arrivals
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative min-h-[680px] overflow-hidden bg-gray-100">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85"
          alt="Bira's Collections fashion collection"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/30" />

        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-end px-5 pb-16 lg:px-8 lg:pb-24">
          <div className="max-w-xl text-white">

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]">
              New Collection
            </p>

            <h1 className="text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Style that
              <br />
              speaks for you.
            </h1>

            <p className="mt-6 max-w-md text-sm leading-6 text-white/85 sm:text-base">
              Discover carefully selected fashion pieces designed to bring
              confidence, comfort, and personality into your everyday style.
            </p>

            <a
              href="/shop"
              className="mt-8 inline-flex items-center gap-3 bg-white px-7 py-4 text-sm font-semibold text-black transition hover:bg-gray-200"
            >
              Shop Collection
              <ArrowRight size={17} />
            </a>

          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">

        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              Explore
            </p>

            <h2 className="mt-2 text-3xl font-medium tracking-tight">
              Shop by category
            </h2>
          </div>

          <a
            href="/shop"
            className="hidden items-center gap-2 text-sm font-medium sm:flex"
          >
            View all
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {categories.map((category) => (
            <a
              key={category.name}
              href="/shop"
              className="group relative h-[430px] overflow-hidden bg-gray-100"
            >
              <img
                src={category.image}
                alt={category.name}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/15 transition group-hover:bg-black/30" />

              <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
                <h3 className="text-2xl font-medium">
                  {category.name}
                </h3>

                <span className="mt-2 inline-flex items-center gap-2 text-sm">
                  Shop now
                  <ArrowRight size={15} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-20">

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="mb-10 flex items-end justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                Curated for you
              </p>

              <h2 className="mt-2 text-3xl font-medium tracking-tight">
                Featured pieces
              </h2>
            </div>

            <a
              href="/shop"
              className="hidden items-center gap-2 text-sm font-medium sm:flex"
            >
              Shop all
              <ArrowRight size={16} />
            </a>

          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">

            {products.map((product) => (
              <article key={product.id} className="group">

                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">

                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  <button
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white"
                    aria-label={`Add ${product.name} to wishlist`}
                  >
                    <Heart size={17} strokeWidth={1.7} />
                  </button>

                </div>

                <div className="pt-4">

                  <p className="text-xs text-gray-500">
                    {product.category}
                  </p>

                  <h3 className="mt-1 text-sm font-medium">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-sm font-semibold">
                    {product.price.toLocaleString()} ETB
                  </p>

                </div>

              </article>
            ))}

          </div>
        </div>
      </section>

      {/* Story Banner */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">

        <div className="grid overflow-hidden bg-[#111111] md:grid-cols-2">

          <div className="flex min-h-[450px] flex-col justify-center px-8 py-14 text-white sm:px-12 lg:px-16">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              Our philosophy
            </p>

            <h2 className="mt-5 text-4xl font-medium leading-tight">
              Fashion should feel like you.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
              Bira's Collections brings together timeless essentials and
              modern pieces that make everyday dressing simple, confident,
              and personal.
            </p>

            <a
              href="/shop"
              className="mt-8 inline-flex w-fit items-center gap-3 border border-white/30 px-6 py-3 text-sm font-medium transition hover:bg-white hover:text-black"
            >
              Discover our collection
              <ArrowRight size={16} />
            </a>

          </div>

          <div className="min-h-[450px]">
            <img
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85"
              alt="Fashion collection"
              className="h-full w-full object-cover"
            />
          </div>

        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-gray-100 px-5 py-20 text-center">

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
          Stay in the loop
        </p>

        <h2 className="mt-3 text-3xl font-medium tracking-tight">
          Join the Bira's Collections community
        </h2>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-500">
          Get updates about new collections, exclusive offers, and special
          releases.
        </p>

        <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">

          <input
            type="email"
            placeholder="Your email address"
            className="h-12 flex-1 border border-gray-200 px-4 text-sm outline-none focus:border-black"
          />

          <button className="h-12 bg-black px-7 text-sm font-medium text-white transition hover:bg-gray-800">
            Subscribe
          </button>

        </div>

      </section>

      {/* Footer */}
      <footer className="bg-black px-5 py-14 text-white lg:px-8">

        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">

          <div className="md:col-span-2">

            <h2 className="text-xl font-semibold">
              Bira's <span className="font-normal">Collections</span>
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-6 text-white/50">
              Modern fashion, carefully selected for your everyday style.
            </p>

          </div>

          <div>
            <h3 className="text-sm font-semibold">
              Shop
            </h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/50">
              <a href="/shop">Women</a>
              <a href="/shop">Men</a>
              <a href="/shop">Accessories</a>
              <a href="/shop">New Arrivals</a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              Help
            </h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/50">
              <a href="/contact">Contact</a>
              <a href="/shipping">Shipping</a>
              <a href="/returns">Returns</a>
              <a href="/faq">FAQ</a>
            </div>
          </div>

        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-xs text-white/40">
          © 2026 Bira's Collections. All rights reserved.
        </div>

      </footer>

    </div>
  );
}

export default Home;