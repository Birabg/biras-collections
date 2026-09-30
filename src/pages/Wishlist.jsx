import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import ProductCard from '../components/product/ProductCard';
import { getProductById } from '../data/products';

export default function Wishlist() {
  const { wishlist, removeItem, clearWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const toast = useToast();

  const handleMoveToCart = (item) => {
    const product = getProductById(item.id);
    if (product) {
      addToCart(product, 1);
      removeItem(item.id);
      toast.success('Moved to bag', { message: `${item.name} added to your bag` });
    }
  };

  const handleRemove = (id, name) => {
    removeItem(id);
    toast.success('Removed from wishlist', { message: `${name} removed from your wishlist` });
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5 py-20">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="You haven't saved anything yet. Explore our collection and save your favorites."
          action={
            <Link to="/shop" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
              Explore Collection
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-medium tracking-tight">Wishlist</h1>
              <p className="mt-2 text-gray-500">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
            </div>
            {wishlist.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Remove all items from your wishlist?')) {
                    clearWishlist();
                    toast.success('Wishlist cleared');
                  }
                }}
                className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1.5"
              >
                <Trash2 size={16} strokeWidth={1.7} />
                Clear all
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {wishlist.map((item) => {
            const product = getProductById(item.id) || item;
            return (
              <div key={item.id} className="group relative">
                <ProductCard
                  product={product}
                  inWishlist={true}
                  onToggleWishlist={() => handleRemove(item.id, item.name)}
                  onAddToCart={() => handleMoveToCart(item)}
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="px-3 py-2 bg-white text-xs font-medium rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    Move to Bag
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}