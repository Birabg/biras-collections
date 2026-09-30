import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, Minus, Plus, Share2, Truck, RotateCcw, Shield, Star } from 'lucide-react';
import { getProductBySlug, getRelatedProducts } from '../data/products';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/ui/Toast';
import { ProductGridSkeleton } from '../components/ui/LoadingState';
import ProductCard from '../components/product/ProductCard';

export default function Product() {
  const { slug } = useParams();
  const product = getProductBySlug(slug);
  const relatedProducts = getRelatedProducts(product?.id, product?.category);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const { addItem: addToCart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const toast = useToast();

  const images = product?.images || [product?.image].filter(Boolean);
  const currentColor = product?.colors?.[selectedColor];

  useEffect(() => {
    if (product?.sizes?.length && !selectedSize) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product, selectedSize]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes?.length && !selectedSize) {
      toast.error('Select a size', { message: 'Please select a size before adding to bag' });
      return;
    }
    setIsAdding(true);
    addToCart(product, quantity, selectedSize, currentColor?.name);
    toast.success('Added to bag', { message: `${product.name} added to your bag` });
    setIsAdding(false);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleItem(product);
    const nowInWishlist = isInWishlist(product.id);
    toast.success(
      nowInWishlist ? 'Added to wishlist' : 'Removed from wishlist',
      { message: nowInWishlist ? `${product.name} added to your wishlist` : `${product.name} removed from your wishlist` }
    );
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-2xl font-medium">Product not found</h1>
          <p className="mt-2 text-gray-500">The product you're looking for doesn't exist.</p>
          <Link to="/shop" className="mt-4 inline-flex items-center gap-2 text-black hover:underline">
            Continue shopping <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <nav className="border-b border-gray-100 bg-gray-50" aria-label="Breadcrumb">
        <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-black">Home</Link></li>
            <li><ChevronRight size={14} aria-hidden="true" /></li>
            <li><Link to="/shop" className="hover:text-black">Shop</Link></li>
            <li><ChevronRight size={14} aria-hidden="true" /></li>
            <li><Link to={`/shop?category=${product.category}`} className="hover:text-black capitalize">{product.category}</Link></li>
            <li><ChevronRight size={14} aria-hidden="true" /></li>
            <li aria-current="page" className="text-gray-900 truncate max-w-xs">{product.name}</li>
          </ol>
        </div>
      </nav>

      {/* Product Content */}
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div className="sticky top-24 self-start">
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-xl">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-black' : 'border-transparent hover:border-gray-300'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                    aria-current={selectedImage === idx ? 'true' : 'false'}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Share & Wishlist */}
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleToggleWishlist}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                  isInWishlist(product.id)
                    ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                aria-pressed={isInWishlist(product.id)}
              >
                <Heart size={18} strokeWidth={isInWishlist(product.id) ? 3 : 1.7} className={isInWishlist(product.id) ? 'fill-red-500' : ''} />
                <span>{isInWishlist(product.id) ? 'Saved' : 'Save'}</span>
              </button>

              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 size={18} strokeWidth={1.7} />
                <span>Share</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <Truck className="mx-auto h-6 w-6 text-gray-400 mb-2" strokeWidth={1.7} />
                <p className="text-xs text-gray-500">Free delivery over 5,000 ETB</p>
              </div>
              <div className="p-4">
                <RotateCcw className="mx-auto h-6 w-6 text-gray-400 mb-2" strokeWidth={1.7} />
                <p className="text-xs text-gray-500">30-day returns</p>
              </div>
              <div className="p-4">
                <Shield className="mx-auto h-6 w-6 text-gray-400 mb-2" strokeWidth={1.7} />
                <p className="text-xs text-gray-500">Secure payment</p>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 capitalize">{product.category}</p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight">{product.name}</h1>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" strokeWidth={0} />
                <span className="font-medium">{product.rating}</span>
                <span className="text-gray-500">({product.reviewCount} reviews)</span>
              </div>
            </div>

            <div className="mt-6 flex items-baseline gap-4">
              <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-xl text-gray-400 line-through">{formatPrice(product.compareAtPrice)}</span>
              )}
            </div>

            <p className="mt-6 text-gray-600 leading-7">{product.description}</p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 1 && (
              <fieldset className="mt-8">
                <legend className="text-sm font-medium mb-3">Color</legend>
                <div className="flex gap-3">
                  {product.colors.map((color, idx) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(idx)}
                      className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                        selectedColor === idx
                          ? 'border-black ring-2 ring-black ring-offset-2'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.name}
                      aria-pressed={selectedColor === idx}
                    >
                      {selectedColor === idx && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600">{product.colors[selectedColor]?.name}</p>
              </fieldset>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <fieldset className="mt-8">
                <legend className="text-sm font-medium mb-3">Size</legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-11 w-11 min-w-[44px] rounded-md border font-medium text-sm transition-colors ${
                        selectedSize === size
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                      aria-pressed={selectedSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedSize && <p className="mt-2 text-sm text-gray-600">Selected: {selectedSize}</p>}
              </fieldset>
            )}

            {/* Quantity Selector */}
            <div className="mt-8">
              <label htmlFor="quantity" className="text-sm font-medium mb-3 block">Quantity</label>
              <div className="inline-flex items-center border border-gray-200 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  <Minus size={18} strokeWidth={2} />
                </button>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-x border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                  min="1"
                  max={product.stock}
                  aria-label="Quantity"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-3 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                  aria-label="Increase quantity"
                  disabled={quantity >= product.stock}
                >
                  <Plus size={18} strokeWidth={2} />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">{product.stock - quantity < 5 ? `Only ${product.stock} left in stock` : `${product.stock} in stock`}</p>
            </div>

            {/* Add to Cart & Buy Now */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="flex-1 h-12 bg-black text-white text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isAdding ? 'Adding...' : 'Add to Bag'}
              </button>

              <Link
                to="/checkout"
                className="flex-1 h-12 flex items-center justify-center border border-gray-200 text-sm font-semibold text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
              >
                Buy Now
              </Link>
            </div>

            {/* Product Tabs */}
            <div className="mt-12 border-t border-gray-100 pt-8">
              <ProductTabs product={product} />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16" aria-labelledby="related-heading">
            <div className="mb-8 flex items-end justify-between">
              <h2 id="related-heading" className="text-2xl font-medium">You may also like</h2>
              <Link to={`/shop?category=${product.category}`} className="text-sm font-medium hover:underline">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ProductTabs({ product }) {
  const [activeTab, setActiveTab] = useState('description');

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'details', label: 'Details' },
    { id: 'shipping', label: 'Shipping & Returns' },
  ];

  return (
    <div>
      <div className="flex border-b border-gray-100" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {activeTab === 'description' && (
          <div id="description-panel" role="tabpanel" aria-labelledby="description-tab" className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-7">{product.description}</p>
          </div>
        )}

        {activeTab === 'details' && (
          <div id="details-panel" role="tabpanel" aria-labelledby="details-tab" className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><dt className="text-gray-500">Category</dt><dd className="font-medium capitalize">{product.category}</dd></div>
              <div><dt className="text-gray-500">Subcategory</dt><dd className="font-medium capitalize">{product.subcategory}</dd></div>
              <div><dt className="text-gray-500">Available Sizes</dt><dd className="font-medium">{product.sizes?.join(', ') || 'One Size'}</dd></div>
              <div><dt className="text-gray-500">Available Colors</dt><dd className="font-medium">{product.colors?.map(c => c.name).join(', ')}</dd></div>
              <div><dt className="text-gray-500">Rating</dt><dd className="font-medium">{product.rating} ({product.reviewCount} reviews)</dd></div>
            </dl>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div id="shipping-panel" role="tabpanel" aria-labelledby="shipping-tab" className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Delivery</h4>
              <p>Free delivery on orders over 5,000 ETB. Standard delivery takes 3-5 business days within Addis Ababa, 5-7 business days to other regions.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Returns</h4>
              <p>We accept returns within 30 days of delivery. Items must be unworn, unwashed, and with original tags attached. Return shipping is free for orders over 5,000 ETB.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Exchanges</h4>
              <p>Size and color exchanges are free. Contact our support team to initiate an exchange.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}