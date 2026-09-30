import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Share2,
  Star,
  Check,
  Truck,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { getProductBySlug, getRelatedProducts } from '../data/products';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/ui/Toast';
import ProductCard from '../components/product/ProductCard';
import ProductGrid from '../components/product/ProductGrid';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const DELIVERY_NOTES = [
  { icon: Truck, title: 'Free over 5,000 ETB', body: '150 ETB flat below that' },
  { icon: RotateCcw, title: '14-day returns', body: 'Tags on, unworn' },
  { icon: ShieldCheck, title: 'Secure payment', body: 'Telebirr, Birr, CBE' },
];

/* ------------------------------------------------------------------ gallery */

function Gallery({ images, name, selectedIndex, onSelect }) {
  const step = (delta) => {
    const next = (selectedIndex + delta + images.length) % images.length;
    onSelect(next);
  };

  if (images.length === 1) {
    return (
      <div className="aspect-[3/4] overflow-hidden bg-sand">
        <img
          src={images[0]}
          alt={name}
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    // Thumbnails are a vertical rail on desktop, a horizontal scroller on mobile.
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[5rem_minmax(0,1fr)] md:gap-4">
      <div
        className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col md:overflow-visible"
        role="group"
        aria-label="Product images"
      >
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`View image ${index + 1} of ${images.length}`}
            aria-current={selectedIndex === index ? 'true' : undefined}
            className={`relative aspect-[3/4] w-20 shrink-0 overflow-hidden border transition-colors md:w-full ${
              selectedIndex === index ? 'border-ink' : 'border-transparent hover:border-line'
            }`}
          >
            <img src={src} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
          </button>
        ))}
      </div>

      <div className="order-1 md:order-2">
        <div className="relative aspect-[3/4] overflow-hidden bg-sand">
          <img
            src={images[selectedIndex]}
            alt={`${name} — view ${selectedIndex + 1} of ${images.length}`}
            fetchPriority={selectedIndex === 0 ? 'high' : 'auto'}
            decoding="async"
            className="size-full object-cover"
          />

          <span
            className="pointer-events-none absolute right-3 top-3 bg-paper/95 px-2.5 py-1 text-[0.625rem] tabular-nums tracking-[0.12em] text-ink-60"
            aria-hidden="true"
          >
            {selectedIndex + 1} / {images.length}
          </span>

          {/* Arrows are a touch affordance; desktop uses the thumbnail rail. */}
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 md:hidden">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="flex size-11 items-center justify-center bg-paper/90 text-ink backdrop-blur-sm"
            >
              <ChevronLeft size={18} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="flex size-11 items-center justify-center bg-paper/90 text-ink backdrop-blur-sm"
            >
              <ChevronRight size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const product = getProductBySlug(slug);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState('');
  const [detailsTab, setDetailsTab] = useState('description');

  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const toast = useToast();

  const needsSizeChoice = Boolean(product?.sizes?.length > 1);
  const saved = product ? isInWishlist(product.id) : false;
  const onSale = Boolean(product?.compareAtPrice && product.compareAtPrice > product.price);
  const soldOut = !product || product.stock === 0;
  const lowStock = product ? product.stock > 0 && product.stock < 5 : false;

  /*
   * Size is only forced when there is a real choice to make. A single
   * "One Size" product should not show an error for not choosing.
   */
  const handleAddToCart = useCallback(() => {
    if (!product) return;

    if (needsSizeChoice && !selectedSize) {
      setSizeError('Choose a size to continue.');
      return;
    }

    setSizeError('');
    const size = selectedSize ?? product.sizes?.[0] ?? null;
    const color = product.colors?.[selectedColor]?.name ?? null;

    addItem(product, quantity, size, color);
    toast.success('Added to bag', {
      message: `${product.name} (${size}) added to your bag`,
    });
  }, [product, needsSizeChoice, selectedSize, selectedColor, quantity, addItem, toast, setSizeError]);

  const handleToggleWishlist = useCallback(() => {
    if (!product) return;
    const wasSaved = isInWishlist(product.id);
    toggleItem(product);
    toast.success(wasSaved ? 'Removed from wishlist' : 'Saved to wishlist', {
      message: wasSaved
        ? `${product.name} removed from your wishlist`
        : `${product.name} saved to your wishlist`,
    });
  }, [product, isInWishlist, toggleItem, toast]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    const shareData = { title: product.name, text: product.name, url: window.location.href };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied', { message: 'Product link copied to your clipboard' });
    } catch {
      // A cancelled share sheet is not an error worth reporting.
    }
  }, [product, toast]);

  if (!product) {
    return (
      <div className="shell section-y">
        <EmptyState
          icon={ShoppingBag}
          title="We couldn't find that piece"
          description="It may have sold out or moved. The rest of the collection is still here."
          actionLabel="Browse the collection"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const related = getRelatedProducts(product.id, product.category);
  const activeColor = product.colors?.[selectedColor];

  const detailTabs = [
    { id: 'description', label: 'Description' },
    { id: 'details', label: 'Details & care' },
    { id: 'delivery', label: 'Delivery & returns' },
  ];

  return (
    <>
      <div className="shell py-5">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-[0.75rem] text-ink-40">
            <li>
              <Link to="/" className="link-underline hover:text-ink">
                Home
              </Link>
            </li>
            <ChevronRight size={12} strokeWidth={1.5} aria-hidden="true" />
            <li>
              <Link to="/shop" className="link-underline hover:text-ink">
                Shop
              </Link>
            </li>
            <ChevronRight size={12} strokeWidth={1.5} aria-hidden="true" />
            <li>
              <Link
                to={`/shop?category=${product.category}`}
                className="link-underline capitalize hover:text-ink"
              >
                {product.category}
              </Link>
            </li>
            <ChevronRight size={12} strokeWidth={1.5} aria-hidden="true" />
            <li aria-current="page" className="truncate text-ink">
              {product.name}
            </li>
          </ol>
        </nav>
      </div>

      <div className="shell pb-16 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_28rem] xl:gap-20">
          <Gallery
            images={images}
            name={product.name}
            selectedIndex={selectedImage}
            onSelect={setSelectedImage}
          />

          {/* Purchase column */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="t-eyebrow text-ink-40">{product.subcategory ?? product.category}</p>

            <h1 className="t-page mt-3">{product.name}</h1>

            {product.reviewCount > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-[0.8125rem] text-ink-60">
                <span className="flex" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={13}
                      strokeWidth={1.4}
                      className={
                        index < Math.round(product.rating) ? 'fill-ink text-ink' : 'text-ink-25'
                      }
                    />
                  ))}
                </span>
                <span>
                  {product.rating} · {product.reviewCount} reviews
                </span>
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={`text-xl tabular-nums ${onSale ? 'text-sale' : 'text-ink'}`}
              >
                {formatPrice(product.price)}
              </span>
              {onSale && (
                <>
                  <span className="text-[0.9375rem] text-ink-25 line-through tabular-nums">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="t-eyebrow text-sale">
                    Save {formatPrice(product.compareAtPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            <p className="t-body mt-6">{product.description}</p>

            {lowStock && (
              <p className="t-caption mt-4 text-warning" role="status">
                Only {product.stock} left in stock
              </p>
            )}

            {/* Colour */}
            {product.colors?.length > 1 && (
              <fieldset className="mt-8">
                <legend className="t-eyebrow text-ink-40">Colour</legend>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {product.colors.map((color, index) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(index)}
                      aria-label={color.name}
                      aria-pressed={selectedColor === index}
                      className={`relative size-9 rounded-full border transition-all ${
                        selectedColor === index
                          ? 'border-ink ring-1 ring-ink ring-offset-2 ring-offset-paper'
                          : 'border-line hover:border-ink-40'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {selectedColor === index && (
                        <span
                          className="absolute inset-0 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <Check
                            size={13}
                            strokeWidth={2.5}
                            className={color.hex?.toLowerCase() === '#ffffff' ? 'text-ink' : 'text-paper'}
                          />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="t-caption mt-2.5 text-ink-60">{activeColor?.name}</p>
              </fieldset>
            )}

            {/* Size */}
            {product.sizes?.length > 0 && (
              <fieldset className="mt-7">
                <legend className="t-eyebrow text-ink-40">Size</legend>

                <div className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError('');
                      }}
                      aria-pressed={selectedSize === size}
                      className={`h-11 min-w-12 border px-3 text-[0.8125rem] transition-colors ${
                        selectedSize === size
                          ? 'border-ink bg-ink text-paper'
                          : 'border-line text-ink-60 hover:border-ink'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {sizeError && (
                  <p role="alert" className="t-caption mt-2.5 text-error">
                    {sizeError}
                  </p>
                )}
              </fieldset>
            )}

            {/* Quantity */}
            {!soldOut && (
              <div className="mt-7">
                <label htmlFor="quantity" className="t-eyebrow text-ink-40">
                  Quantity
                </label>
                <div className="mt-3 inline-flex items-center border border-line">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="flex size-11 items-center justify-center text-ink-60 transition-colors hover:text-ink disabled:opacity-30"
                  >
                    <Minus size={15} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10);
                      setQuantity(Number.isNaN(next) ? 1 : Math.min(Math.max(next, 1), product.stock));
                    }}
                    className="h-11 w-14 border-x border-line text-center text-[0.875rem] tabular-nums outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                    className="flex size-11 items-center justify-center text-ink-60 transition-colors hover:text-ink disabled:opacity-30"
                  >
                    <Plus size={15} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3">
              {soldOut ? (
                <Button size="lg" fullWidth disabled>
                  Sold out
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    fullWidth
                    onClick={handleAddToCart}
                    iconLeft={<ShoppingBag size={15} strokeWidth={2} aria-hidden="true" />}
                  >
                    Add to bag
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={handleToggleWishlist}
                      aria-pressed={saved}
                      className="flex-1"
                      iconLeft={
                        <Heart
                          size={15}
                          strokeWidth={1.75}
                          className={saved ? 'fill-ink' : ''}
                          aria-hidden="true"
                        />
                      }
                    >
                      {saved ? 'Saved' : 'Save'}
                    </Button>

                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={handleShare}
                      aria-label="Share this product"
                      className="flex-1"
                      iconLeft={<Share2 size={15} strokeWidth={1.75} aria-hidden="true" />}
                    >
                      Share
                    </Button>
                  </div>
                </>
              )}
            </div>

            <ul className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6">
              {DELIVERY_NOTES.map((note) => (
                <li key={note.title}>
                  <note.icon size={18} strokeWidth={1.4} className="text-ink-60" aria-hidden="true" />
                  <p className="mt-2 text-[0.75rem] font-medium leading-tight text-ink">
                    {note.title}
                  </p>
                  <p className="mt-1 text-[0.6875rem] leading-tight text-ink-40">{note.body}</p>
                </li>
              ))}
            </ul>

            {/* Details tabs */}
            <div className="mt-10 border-t border-line pt-8">
              <div role="tablist" aria-label="Product information" className="flex gap-6">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={detailsTab === tab.id}
                    aria-controls={`panel-${tab.id}`}
                    onClick={() => setDetailsTab(tab.id)}
                    className={`-mb-px border-b-2 pb-3 text-[0.8125rem] transition-colors ${
                      detailsTab === tab.id
                        ? 'border-ink text-ink'
                        : 'border-transparent text-ink-40 hover:text-ink-60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="pt-5">
                {detailsTab === 'description' && (
                  <div id="panel-description" role="tabpanel" aria-labelledby="tab-description">
                    <p className="t-body">{product.description}</p>
                  </div>
                )}

                {detailsTab === 'details' && (
                  <div id="panel-details" role="tabpanel" aria-labelledby="tab-details">
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[0.8125rem]">
                      <div>
                        <dt className="text-ink-40">Category</dt>
                        <dd className="mt-0.5 capitalize text-ink">{product.category}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-40">Type</dt>
                        <dd className="mt-0.5 capitalize text-ink">{product.subcategory ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-40">Sizes</dt>
                        <dd className="mt-0.5 text-ink">{product.sizes?.join(', ') ?? 'One size'}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-40">Colours</dt>
                        <dd className="mt-0.5 text-ink">
                          {product.colors?.map((color) => color.name).join(', ') ?? '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}

                {detailsTab === 'delivery' && (
                  <div id="panel-delivery" role="tabpanel" aria-labelledby="tab-delivery">
                    <div className="flex flex-col gap-3 text-[0.875rem] leading-relaxed text-ink-60">
                      <p>
                        Free delivery on orders over 5,000 ETB, otherwise 150 ETB flat. Addis Ababa
                        takes 3–5 business days; other regions 5–7.
                      </p>
                      <p>
                        Returns accepted within 14 days of delivery, unworn with original tags.
                      </p>
                      <p>
                        <Link to="/shipping" className="link-underline text-ink">
                          Full delivery and returns policy
                        </Link>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line" aria-labelledby="related-heading">
          <div className="shell section-y">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="related-heading" className="t-section">
                You may also like
              </h2>
              <Link
                to={`/shop?category=${product.category}`}
                className="link-underline inline-flex items-center gap-1.5 self-start text-[0.8125rem] text-ink sm:self-auto"
              >
                View all {product.category}
                <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
              </Link>
            </header>

            <div className="mt-10 lg:mt-14">
              <ProductGrid
                products={related}
                renderItem={(item) => <ProductCard product={item} />}
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
